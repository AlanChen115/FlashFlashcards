import csv
import html
import io
import re
import sqlite3
import tempfile
import zipfile
from pathlib import Path


def import_flashcard_file(file, language):
    filename = file.name.lower()
    if filename.endswith('.csv') or filename.endswith('.txt') or filename.endswith('.tsv'):
        return parse_csv_flashcards(file, language)
    elif filename.endswith('.apkg'):
        return parse_anki_flashcards(file, language)
    else:
        raise ValueError("Unsupported file format")


def parse_csv_flashcards(file, language):
    text = _decode_uploaded_file(file)
    rows = _parse_delimited_rows(text)

    flashcards = []
    for row in rows:
        row = [cell.strip() for cell in row]
        if _should_skip_row(row):
            continue

        front = row[0]
        back = row[1]

        flashcards.append({
            "front": front,
            "back": back,
            "lemma": "",
        })

    return flashcards


def parse_anki_flashcards(file, language):
    with tempfile.TemporaryDirectory() as tmpdir:
        tmpdir_path = Path(tmpdir)
        apkg_path = tmpdir_path / "deck.apkg"

        _write_uploaded_file(file, apkg_path)

        try:
            with zipfile.ZipFile(apkg_path, "r") as package:
                package.extractall(tmpdir_path)
        except zipfile.BadZipFile as exc:
            raise ValueError("Invalid Anki package") from exc

        collection_path = _find_anki_collection(tmpdir_path)
        if not collection_path:
            raise ValueError("Could not find Anki collection database")

        rows = _read_anki_note_fields(collection_path)

    flashcards = []
    for fields_text in rows:
        fields = [_clean_anki_field(field) for field in fields_text.split("\x1f")]
        if len(fields) < 2:
            continue

        front = fields[0]
        back = fields[1]
        if not front or not back:
            continue

        flashcards.append({
            "front": front,
            "back": back,
            "lemma": "",
        })

    return flashcards


def _decode_uploaded_file(file):
    raw = file.read()
    if isinstance(raw, str):
        return raw

    for encoding in ("utf-8-sig", "utf-16", "latin-1"):
        try:
            return raw.decode(encoding)
        except UnicodeDecodeError:
            continue

    return raw.decode("utf-8", errors="replace")


def _write_uploaded_file(file, path):
    with open(path, "wb") as output:
        if hasattr(file, "chunks"):
            for chunk in file.chunks():
                output.write(chunk)
        else:
            output.write(file.read())


def _find_anki_collection(directory):
    for name in ("collection.anki21", "collection.anki2"):
        candidate = directory / name
        if candidate.exists():
            return candidate
    return None


def _read_anki_note_fields(collection_path):
    connection = sqlite3.connect(collection_path)
    try:
        rows = connection.execute("SELECT flds FROM notes").fetchall()
    finally:
        connection.close()

    return [row[0] for row in rows]


def _clean_anki_field(value):
    value = value.replace("<br>", "\n").replace("<br/>", "\n").replace("<br />", "\n")
    value = re.sub(r"<[^>]+>", "", value)
    value = html.unescape(value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


def _parse_delimited_rows(text):
    sample = text[:4096]
    delimiter = _detect_delimiter(sample)
    rows = list(csv.reader(io.StringIO(text), delimiter=delimiter))

    if delimiter != "\t" and _has_tsv_shape(text):
        rows = list(csv.reader(io.StringIO(text), delimiter="\t"))

    return rows


def _detect_delimiter(sample):
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters="\t,;")
        return dialect.delimiter
    except csv.Error:
        if "\t" in sample:
            return "\t"
        return ","


def _has_tsv_shape(text):
    rows = list(csv.reader(io.StringIO(text), delimiter="\t"))
    return any(len(row) >= 2 for row in rows)


def _should_skip_row(row):
    if len(row) < 2:
        return True

    front = row[0].strip()
    back = row[1].strip()
    if not front or not back:
        return True

    header_pairs = {
        ("term", "definition"),
        ("terms", "definitions"),
        ("front", "back"),
        ("question", "answer"),
    }

    return (front.lower(), back.lower()) in header_pairs
