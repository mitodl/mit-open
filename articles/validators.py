import nh3

article_html_config = {
    "tags": {
        # Headings
        "h2",
        "h3",
        "h4",
        # Basic typographic styles
        "p",
        "strong",
        "i",
        "em",
        # Lists
        "ol",
        "ul",
        "li",
        # Links
        "a",
        # Images
        "figure",
        "img",
        "figcaption",
        # Blockquotes
        "blockquote",
        # media embed
        # This is a custom tag that won't be rendered directly by browsers
        "oembed",
    },
    # See ammonia defaults:
    # - On specific tags: https://docs.rs/ammonia/latest/ammonia/struct.Builder.html#method.tag_attributes
    # - On all tags: https://docs.rs/ammonia/latest/ammonia/struct.Builder.html#method.generic_attributes
    "attributes": {
        "a": {"href", "hreflang"},
        "img": {"alt", "height", "src", "width", "srcset", "sizes"},
        "figure": {"class"},
        "oembed": {"url"},
    },
}


def clean_html(html: str) -> str:
    return nh3.clean(html, **article_html_config)
