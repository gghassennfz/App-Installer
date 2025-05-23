// Map of tool IDs to their icon paths
export const iconPaths = {
  'Git.Git': '/icons/git.svg',
  'OpenJDK.OpenJDK': '/icons/java.svg',
  'ApacheFriends.XAMPP': '/icons/xampp.svg',
  'OpenJS.NodeJS': '/icons/nodejs.svg',
  'Microsoft.VisualStudioCode': '/icons/vscode.svg',
  'Docker.DockerDesktop': '/icons/docker.svg',
  'Postman.Postman': '/icons/postman.svg',
  'Python.Python.3': '/icons/python.svg',
  'Notepad++.Notepad++': '/icons/notepadpp.svg',
  '7zip.7zip': '/icons/7zip.svg',
  'SlackTechnologies.Slack': '/icons/slack.svg',
  'Nginx.Nginx': '/icons/nginx.svg',
  'HashiCorp.Vagrant': '/icons/vagrant.svg',
  'Docker.DockerCompose': '/icons/docker-compose.svg',
  'Kubernetes.kubectl': '/icons/kubernetes.svg',
  'MongoDB.Server': '/icons/mongodb.svg',
  'Redis.Redis': '/icons/redis.svg',
  'SQLite.SQLite': '/icons/sqlite.svg',
  'PostgreSQL.PostgreSQL': '/icons/postgresql.svg',
  'Oracle.VirtualBox': '/icons/virtualbox.svg',
  'Tableau.Desktop': '/icons/tableau.svg',
  'Figma.Figma': '/icons/figma.svg',
  'Inkscape.Inkscape': '/icons/inkscape.svg',
  'GitHub.GitHubDesktop': '/icons/github.svg',
  'Microsoft.Teams': '/icons/teams.svg',
  'Notion.Notion': '/icons/notion.svg',
  'RARLAB.WinRAR': '/icons/winrar.svg',
  'Piriform.CCleaner': '/icons/ccleaner.svg',
  'BlenderFoundation.Blender': '/icons/blender.svg',
  'SublimeHQ.SublimeText': '/icons/sublime.svg',
  'GitHub.Atom': '/icons/atom.svg',
  'Adobe.Brackets': '/icons/brackets.svg',
  'Insomnia.Insomnia': '/icons/insomnia.svg',
  'AutoHotkey.AutoHotkey': '/icons/autohotkey.svg',
  'voidtools.Everything': '/icons/everything.svg',
  'DittoClipboard.Ditto': '/icons/ditto.svg',
};

// Placeholder icon for tools without a specific icon
export const defaultIcon = '/icons/default-tool.svg';

// Get the icon path for a tool ID
export function getIconPath(toolId) {
  return iconPaths[toolId] || defaultIcon;
}
