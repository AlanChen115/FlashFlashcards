const API_BASE = "/api";

export async function postJSON(path, body) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function getJSON(path, params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, value);
    }
  });

  const queryString = searchParams.toString();
  const response = await fetch(`${API_BASE}${path}${queryString ? `?${queryString}` : ""}`);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return await response.json();
}

export function createFileFormData(files, fields = {}) {
  const formData = new FormData();

  for (let i = 0; i < files.length; i++) {
    formData.append("files", files[i]);
  }

  Object.entries(fields).forEach(([key, value]) => {
    formData.append(key, value);
  });

  return formData;
}

export async function postFormData(path, formData) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return await response.json();
}

export function parseImages(formData) {
  return postFormData("/ai_generator/parse_images/", formData);
}

export function parseWebsite(urls, language) {
  return postJSON("/ai_generator/parse_website/", { urls, language });
}

export function checkSimilarFlashcards(flashcards, language) {
  return postJSON("/storage/similar/", { flashcards, language });
}

export function commitFlashcards(flashcards, language) {
  return postJSON("/storage/commit/", { flashcards, language });
}

export function importFlashcards(formData) {
  return postFormData("/storage/import/", formData);
}

export function clearFlashcardsDatabase() {
  return postJSON("/storage/clear/", {});
}

export function removeFlashcard(flashcards, language) {
  return postJSON("/storage/remove/", { flashcards, language });
}

export function getAllFlashcards() {
  return getJSON("/storage/list/");
}

export function searchFlashcards(query, language) {
  return getJSON("/storage/search/", { q: query, language });
}

export function updateFlashcard(flashcard) {
  return postJSON("/storage/update/", flashcard);
}

export async function exportFlashcards(flashcards, exportFormat) {
  const response = await fetch(`${API_BASE}/exporter/${exportFormat}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ flashcards }),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return await response.blob();
}
