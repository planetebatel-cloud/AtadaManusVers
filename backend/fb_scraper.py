"""
ATADA — Facebook Group Job Scraper
Scrolls a Facebook group feed, screenshots each post, sends to parser API.

Usage:
    # First time — log into Facebook and save cookies
    python fb_scraper.py --login

    # Scrape a group (backend must be running on :8002)
    python fb_scraper.py "https://www.facebook.com/groups/GROUP_ID" --max-posts 20

    # Headed mode (see the browser)
    python fb_scraper.py "https://www.facebook.com/groups/GROUP_ID" --headed
"""

import argparse
import asyncio
import json
import sys
from pathlib import Path

import httpx
from playwright.async_api import async_playwright

COOKIES_FILE = Path(__file__).parent / "fb_cookies.json"
PARSER_URL = "http://127.0.0.1:8002/api/parser/parse"
POST_SELECTOR = 'div[role="article"]'
MIN_POST_HEIGHT = 150  # skip tiny posts (reactions, shares without text)
SCROLL_PAUSE = 2.0     # seconds between scrolls
POST_DELAY = 3.0       # seconds between API calls


async def login_flow():
    """Open headed browser so user can log into Facebook. Saves cookies."""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 900},
            locale="he-IL",
        )
        page = await context.new_page()
        await page.goto("https://www.facebook.com/")

        print("=" * 50)
        print("Log into Facebook in the browser window.")
        print("When you see your feed, press ENTER here.")
        print("=" * 50)

        await asyncio.get_event_loop().run_in_executor(None, input)

        cookies = await context.cookies()
        COOKIES_FILE.write_text(json.dumps(cookies, ensure_ascii=False, indent=2))
        print(f"Cookies saved to {COOKIES_FILE} ({len(cookies)} cookies)")

        await browser.close()


SEE_MORE_TEXTS = ["See more", "Ещё", "עוד", "еще", "More", "Mehr", "Plus"]


async def _expand_post(post):
    """Click 'See more' button inside a post to reveal full text."""
    for label in SEE_MORE_TEXTS:
        try:
            # Facebook wraps "See more" in a div[role="button"] or a span
            btn = post.locator(f'div[role="button"]:has-text("{label}")').first
            if await btn.is_visible(timeout=300):
                await btn.click()
                await btn.page.wait_for_timeout(600)
                return
        except Exception:
            pass
        try:
            # Fallback: plain text match on any clickable element
            btn = post.get_by_text(label, exact=True).first
            if await btn.is_visible(timeout=300):
                await btn.click()
                await btn.page.wait_for_timeout(600)
                return
        except Exception:
            pass


async def scrape_group(group_url: str, max_posts: int, headed: bool):
    """Scrape Facebook group: scroll, screenshot posts, send to parser."""
    if not COOKIES_FILE.exists():
        print("No cookies found. Run with --login first.")
        sys.exit(1)

    cookies = json.loads(COOKIES_FILE.read_text())

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=not headed)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 900},
            locale="he-IL",
        )
        await context.add_cookies(cookies)

        page = await context.new_page()
        print(f"Navigating to {group_url} ...")
        await page.goto(group_url, wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)

        # Close any popups (cookie banners, login prompts)
        for selector in ['div[role="dialog"] div[aria-label="Close"]', '[data-testid="cookie-policy-manage-dialog-accept-button"]']:
            btn = page.locator(selector).first
            if await btn.is_visible():
                await btn.click()
                await page.wait_for_timeout(1000)

        processed = 0
        seen_ids = set()
        scroll_attempts = 0
        max_scroll_attempts = max_posts * 3  # safety limit

        async with httpx.AsyncClient(timeout=90.0) as client:
            while processed < max_posts and scroll_attempts < max_scroll_attempts:
                posts = await page.locator(POST_SELECTOR).all()

                for post in posts:
                    if processed >= max_posts:
                        break

                    # Deduplicate by bounding box position
                    try:
                        box = await post.bounding_box()
                    except Exception:
                        continue
                    if not box:
                        continue

                    post_id = f"{int(box['x'])}_{int(box['y'])}_{int(box['width'])}_{int(box['height'])}"
                    if post_id in seen_ids:
                        continue
                    seen_ids.add(post_id)

                    if box["height"] < MIN_POST_HEIGHT:
                        continue

                    # Scroll into view, expand "See more", then screenshot
                    try:
                        await post.scroll_into_view_if_needed()
                        await page.wait_for_timeout(500)

                        # Click "See more" / "Ещё" / "עוד" to expand truncated posts
                        await _expand_post(post)

                        screenshot = await post.screenshot(type="png")
                    except Exception as e:
                        print(f"  [skip] Could not screenshot post: {e}")
                        continue

                    # Send to parser API
                    try:
                        resp = await client.post(
                            PARSER_URL,
                            files={"file": ("post.png", screenshot, "image/png")},
                        )
                        if resp.status_code == 200:
                            data = resp.json()
                            processed += 1
                            print(f"  [{processed}/{max_posts}] {data.get('title', '?')} @ {data.get('company', '?')} — saved as {data['id']}")
                        else:
                            print(f"  [skip] Parser returned {resp.status_code}: {resp.text[:100]}")
                    except Exception as e:
                        print(f"  [skip] API error: {e}")

                    await asyncio.sleep(POST_DELAY)

                # Scroll down for more posts
                await page.evaluate("window.scrollBy(0, window.innerHeight)")
                await asyncio.sleep(SCROLL_PAUSE)
                scroll_attempts += 1

        print(f"\nDone. Processed {processed} posts from {group_url}")
        await browser.close()


def main():
    parser = argparse.ArgumentParser(description="ATADA Facebook Group Job Scraper")
    parser.add_argument("url", nargs="?", help="Facebook group URL to scrape")
    parser.add_argument("--login", action="store_true", help="Open browser to log into Facebook")
    parser.add_argument("--max-posts", type=int, default=20, help="Max posts to process (default: 20)")
    parser.add_argument("--headed", action="store_true", help="Show browser window")
    args = parser.parse_args()

    if args.login:
        asyncio.run(login_flow())
    elif args.url:
        asyncio.run(scrape_group(args.url, args.max_posts, args.headed))
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
