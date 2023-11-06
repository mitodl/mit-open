import pytest

from articles.validators import clean_html

# # - On all tags: https://docs.rs/ammonia/latest/ammonia/struct.Builder.html#method.generic_attributes
# },


@pytest.mark.parametrize(
    ("html_in", "expected_out"),
    [
        (
            '<a href="a" bad="b">ammonia</a>',
            '<a href="a" rel="noopener noreferrer">ammonia</a>',
        ),
        (
            (
                '<img alt="alt" height="height" src="src" width="width" srcset="srcset"'
                ' sizes="sizes" bad="bad">'
            ),
            (
                '<img alt="alt" height="height" src="src" width="width" srcset="srcset"'
                ' sizes="sizes">'
            ),
        ),
        (
            # class alllowed on figures
            '<figure class="xyz" bad="bad"></figure>',
            '<figure class="xyz"></figure>',
        ),
        (
            # scripts not allowed
            '<script>alert("Hi")</script>',
            "",
        ),
        (
            # h1 not allowed
            "<h1>1111</h1><h2>2222</h2><h3>3333</h3><h4>4444</h4>",
            "1111<h2>2222</h2><h3>3333</h3><h4>4444</h4>",
        ),
    ],
)
def test_clean_html(html_in, expected_out):
    assert clean_html(html_in) == expected_out
