import { ResolvedAppInfo } from "./types";

interface KnownAppData {
  canonical_name: string;
  slug: string;
  dev_domain: string;
  docs_url: string;
  logo_url: string;
  in_composio: boolean;
  category: string;
}

const KNOWN_DIRECTORY: Record<string, KnownAppData> = {
  github: {
    canonical_name: "GitHub",
    slug: "github",
    dev_domain: "docs.github.com",
    docs_url: "https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app",
    logo_url: "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
    in_composio: true,
    category: "Developer Tools",
  },
  slack: {
    canonical_name: "Slack",
    slug: "slack",
    dev_domain: "api.slack.com",
    docs_url: "https://api.slack.com/authentication/oauth-v2",
    logo_url: "https://a.slack-edge.com/80588/marketing/img/meta/slack_hash_256.png",
    in_composio: true,
    category: "Communication",
  },
  google: {
    canonical_name: "Google Workspace",
    slug: "google-workspace",
    dev_domain: "developers.google.com",
    docs_url: "https://developers.google.com/identity/protocols/oauth2",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_\"G\"_logo.svg/768px-Google_\"G\"_logo.svg.png",
    in_composio: true,
    category: "Productivity",
  },
  gmail: {
    canonical_name: "Google Workspace (Gmail & Drive)",
    slug: "google-workspace",
    dev_domain: "developers.google.com",
    docs_url: "https://developers.google.com/gmail/api/auth/about-auth",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_\"G\"_logo.svg/768px-Google_\"G\"_logo.svg.png",
    in_composio: true,
    category: "Productivity",
  },
  notion: {
    canonical_name: "Notion",
    slug: "notion",
    dev_domain: "developers.notion.com",
    docs_url: "https://developers.notion.com/docs/authorization",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png",
    in_composio: true,
    category: "Productivity",
  },
  twitter: {
    canonical_name: "X (formerly Twitter)",
    slug: "twitter-x",
    dev_domain: "developer.x.com",
    docs_url: "https://developer.x.com/en/docs/authentication/oauth-2-0",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/c/ce/X_logo_2023.svg",
    in_composio: true,
    category: "Social",
  },
  x: {
    canonical_name: "X (formerly Twitter)",
    slug: "twitter-x",
    dev_domain: "developer.x.com",
    docs_url: "https://developer.x.com/en/docs/authentication/oauth-2-0",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/c/ce/X_logo_2023.svg",
    in_composio: true,
    category: "Social",
  },
  linear: {
    canonical_name: "Linear",
    slug: "linear",
    dev_domain: "developers.linear.app",
    docs_url: "https://developers.linear.app/docs/oauth/authentication",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Linear_logo.svg",
    in_composio: true,
    category: "Developer Tools",
  },
  zoom: {
    canonical_name: "Zoom",
    slug: "zoom",
    dev_domain: "developers.zoom.us",
    docs_url: "https://developers.zoom.us/docs/internal-apps/oauth/",
    logo_url: "https://explore.zoom.us/media/zoom-logo.svg",
    in_composio: true,
    category: "Communication",
  },
  asana: {
    canonical_name: "Asana",
    slug: "asana",
    dev_domain: "developers.asana.com",
    docs_url: "https://developers.asana.com/docs/oauth",
    logo_url: "https://assets.asana.biz/transform/77c68832-6a68-45ec-9a67-0cbe44fb86e2/asana-logo",
    in_composio: true,
    category: "Project Management",
  },
  dropbox: {
    canonical_name: "Dropbox",
    slug: "dropbox",
    dev_domain: "dropbox.com/developers",
    docs_url: "https://www.dropbox.com/developers/reference/oauth-guide",
    logo_url: "https://aem.dropbox.com/cms/content/dam/dropbox/www/en-us/branding/dropbox-logo@2x.svg",
    in_composio: true,
    category: "Storage",
  },
  discord: {
    canonical_name: "Discord",
    slug: "discord",
    dev_domain: "discord.com/developers",
    docs_url: "https://discord.com/developers/docs/topics/oauth2",
    logo_url: "https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png",
    in_composio: true,
    category: "Communication",
  },
  spotify: {
    canonical_name: "Spotify",
    slug: "spotify",
    dev_domain: "developer.spotify.com",
    docs_url: "https://developer.spotify.com/documentation/web-api/tutorials/code-flow",
    logo_url: "https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_Green.png",
    in_composio: true,
    category: "Media",
  },
  hubspot: {
    canonical_name: "HubSpot",
    slug: "hubspot",
    dev_domain: "developers.hubspot.com",
    docs_url: "https://developers.hubspot.com/docs/api/working-with-oauth",
    logo_url: "https://www.hubspot.com/hubfs/assets/hubspot.com/style-guide/brand-guidelines/guidelines_sprocket-icon.svg",
    in_composio: true,
    category: "CRM",
  },
  salesforce: {
    canonical_name: "Salesforce",
    slug: "salesforce",
    dev_domain: "developer.salesforce.com",
    docs_url: "https://help.salesforce.com/s/articleView?id=sf.remoteaccess_oauth_web_server_flow.htm",
    logo_url: "https://www.salesforce.com/news/wp-content/uploads/sites/3/2021/05/Salesforce-logo.jpg",
    in_composio: true,
    category: "CRM",
  },
  stripe: {
    canonical_name: "Stripe",
    slug: "stripe",
    dev_domain: "docs.stripe.com",
    docs_url: "https://docs.stripe.com/connect/oauth-reference",
    logo_url: "https://images.ctfassets.net/fzn2n1nzq965/3AjlZ9M8N5xH5nO1yNq2P7/20cba4f4c208c1d533cf87cebb60f06f/stripe-logo.svg",
    in_composio: true,
    category: "Payments",
  },
  atlassian: {
    canonical_name: "Atlassian (Jira / Confluence)",
    slug: "atlassian",
    dev_domain: "developer.atlassian.com",
    docs_url: "https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/",
    logo_url: "https://wac-cdn.atlassian.com/assets/img/favicons/atlassian/favicon.png",
    in_composio: true,
    category: "Developer Tools",
  },
  replit: {
    canonical_name: "Replit",
    slug: "replit",
    dev_domain: "docs.replit.com",
    docs_url: "https://docs.replit.com",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/7/78/Replit_Logo.svg",
    in_composio: false,
    category: "Developer Tools",
  },
  openai: {
    canonical_name: "OpenAI",
    slug: "openai",
    dev_domain: "platform.openai.com",
    docs_url: "https://platform.openai.com/docs/api-reference/authentication",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg",
    in_composio: true,
    category: "AI & Machine Learning",
  },
  anthropic: {
    canonical_name: "Anthropic",
    slug: "anthropic",
    dev_domain: "docs.anthropic.com",
    docs_url: "https://docs.anthropic.com/en/api/getting-started",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/7/78/Anthropic_logo.svg",
    in_composio: true,
    category: "AI & Machine Learning",
  },
  resend: {
    canonical_name: "Resend",
    slug: "resend",
    dev_domain: "resend.com",
    docs_url: "https://resend.com/docs/dashboard/api-keys/introduction",
    logo_url: "https://resend.com/static/brand/resend-icon-black.svg",
    in_composio: true,
    category: "Developer Tools",
  },
};

export function resolveApp(input: string): ResolvedAppInfo {
  let cleaned = input.trim().toLowerCase();
  
  // Strip protocol if user pasted a URL
  cleaned = cleaned.replace(/^https?:\/\//, "").replace(/^www\./, "");
  
  // Extract base name from domain or path
  if (cleaned.includes("/")) {
    cleaned = cleaned.split("/")[0];
  }
  if (cleaned.includes(".")) {
    const parts = cleaned.split(".");
    // e.g. "discord.com" -> "discord", "api.slack.com" -> "slack"
    cleaned = parts[parts.length - 2] || parts[0];
  }

  // Remove whitespace/punctuation
  cleaned = cleaned.replace(/[^a-z0-9]/g, "");

  // Check known directory
  if (KNOWN_DIRECTORY[cleaned]) {
    const found = KNOWN_DIRECTORY[cleaned];
    return {
      canonical_name: found.canonical_name,
      slug: found.slug,
      dev_domain: found.dev_domain,
      docs_url: found.docs_url,
      logo_url: found.logo_url,
      in_composio: found.in_composio,
      category: found.category,
    };
  }

  // Fallback for custom / unfamiliar app
  const formattedTitle = input
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\.com|\.org|\.io|\.app|\.dev/g, "")
    .split(/[-_ ]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const slug = formattedTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return {
    canonical_name: formattedTitle || "Custom Provider",
    slug: slug || "custom-app",
    dev_domain: `developer.${slug}.com`,
    docs_url: `https://developer.${slug}.com/docs/oauth`,
    logo_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(formattedTitle)}&background=6366f1&color=fff`,
    in_composio: false,
    category: "Integration",
  };
}

