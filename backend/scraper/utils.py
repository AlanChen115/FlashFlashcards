import json
import os
import time
import logging
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from urllib.parse import urlparse
from selenium.common.exceptions import TimeoutException, WebDriverException

logger = logging.getLogger(__name__)

def scrape_article(url, timeout=30):
    """
    Scrape an article from a given URL using Selenium + Readability.js.
    Returns a structured dictionary.
    """
    source = find_source(url)
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,1080")

    # Critical: do NOT wait for ads/analytics
    chrome_options.page_load_strategy = "eager"

    driver = webdriver.Chrome(options=chrome_options)

    try:
        driver.set_page_load_timeout(timeout)
        driver.get(url)
        logger.info(f"Scraping {url} from source: {source}")

        # Handle site-specific popups/buttons
        specific_source(source, driver)

        # Load Readability.js
        load_readability(driver)

        # Wait for Readability to load
        if not wait_for_readability(driver, timeout):
            logger.warning("Readability.js failed to load, using fallback")
            return fallback(driver, url, source)

        # Extract article
        result = driver.execute_script("""
            const article = new Readability(document.cloneNode(true)).parse();
            return article ? JSON.stringify(article) : null;
        """)

        if not result:
            return fallback(driver, url, source)

        data = json.loads(result)
        raw_text = data.get("textContent", "").strip()
        title = data.get("title", "").strip()

        cleaned_text = clean_text(raw_text)
        if not cleaned_text:
            logger.warning("Scraped text is empty, using fallback")
            return fallback(driver, url, source)

        data = {
            "body_text": cleaned_text,
            "title": title,
            "source": source,
            "url": url,
            "error": None
        }

        print(data)
        return data

    except (TimeoutException, WebDriverException) as e:
        logger.error(f"Selenium error: {e}")
        return {"body_text": "", "title": "", "source": source, "url": url, "error": str(e)}

    finally:
        driver.quit()

def wait_for_readability(driver, timeout=3):
    try:
        WebDriverWait(driver, timeout).until(
            lambda d: d.execute_script("return typeof Readability !== 'undefined'")
        )
        return True
    except TimeoutException:
        return False

def load_readability(driver):
    scraper_dir = os.path.dirname(__file__)
    filepath = os.path.join(scraper_dir, "readability.js")
    with open(filepath, "r", encoding="utf-8") as f:
        driver.execute_script(f.read())


def fallback(driver, url, source):
    """
    Fallback method for pages where Readability.js fails.
    """
    fallback_text = driver.execute_script("""
        const selectors = [
            'article', 'main',
            'div#bodyContent', 'div.mw-parser-output',
            'section', 'div#content',
            'div.post-content', 'div.entry-content',
            'div.story-body', 'div[itemprop="articleBody"]'
        ];
        for (const sel of selectors) {
            const elem = document.querySelector(sel);
            if (elem && elem.innerText.trim().length > 200) {
                return elem.innerText;
            }
        }
        return null;
    """)
    if not fallback_text:
        try:
            fallback_text = driver.find_element(By.TAG_NAME, "body").text
        except:
            fallback_text = ""

    title = driver.title if driver.title else ""
    cleaned_text = clean_text(fallback_text)

    return {
        "body_text": cleaned_text,
        "title": title,
        "source": source,
        "url": url,
        "error": None
    }


def find_source(url):
    netloc = urlparse(url).netloc
    split = netloc.split('.')
    if 'nhk' in split:
        return 'nhk'
    if len(split) >= 2:
        return split[-2]
    return split[0]


def clean_text(raw_text):
    text = []
    for line in raw_text.split("\n"):
        cleaned = line.strip()
        if cleaned:
            text.append(cleaned)
    text = "\n".join(text)
    return text

def specific_source(source, driver):
    if source == "nhk":
        try:
            button = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located(
                    (By.XPATH, "//button[contains(., '確認しました') or contains(., 'I understand')]")
                )
            )
            driver.execute_script("arguments[0].scrollIntoView(true);", button)
            WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable(
                    (By.XPATH, "//button[contains(., '確認しました') or contains(., 'I understand')]")
                )
            )
            driver.execute_script("arguments[0].click();", button)
        except TimeoutException:
            pass  
