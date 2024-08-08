from main.envs import get_string

MITOL_AUTHENTICATION_PLUGINS = get_string(
    "MITOL_AUTHENTICATION_PLUGINS",
    "learning_resources.plugins.FavoritesListPlugin,profiles.plugins.CreateProfilePlugin",
)
MITOL_LEARNING_RESOURCES_PLUGINS = get_string(
    "MITOL_LEARNING_RESOURCES_PLUGINS",
    "learning_resources_search.plugins.SearchIndexPlugin,channels.plugins.ChannelPlugin",
)
