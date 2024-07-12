from main.envs import get_string

MITOPEN_AUTHENTICATION_PLUGINS = get_string(
    "MITOPEN_AUTHENTICATION_PLUGINS",
    "learning_resources.plugins.FavoritesListPlugin,profiles.plugins.CreateProfilePlugin",
)
MITOPEN_LEARNING_RESOURCES_PLUGINS = get_string(
    "MITOPEN_LEARNING_RESOURCES_PLUGINS",
    "learning_resources_search.plugins.SearchIndexPlugin,channels.plugins.ChannelPlugin",
)
