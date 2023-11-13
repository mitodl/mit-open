from open_discussions.envs import get_string

MITOPEN_AUTHENTICATION_PLUGINS = get_string(
    "MITOPEN_AUTHENTICATION_PLUGINS",
    "learning_resources.plugins.FavoritesListPlugin",
)
