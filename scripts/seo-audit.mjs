import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const defaultBaseUrl = "http://127.0.0.1:3003";
const defaultSiteOrigin = "https://triptimi.com";
const defaultReportPath = "tmp/seo-audit-report.json";
const securityHeaders = [
  "content-security-policy",
  "x-frame-options",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
];

function parseArgs(argv) {
  const args = {
    baseUrl: process.env.SEO_AUDIT_BASE_URL || defaultBaseUrl,
    siteOrigin: process.env.NEXT_PUBLIC_SITE_URL || defaultSiteOrigin,
    limit: Number(process.env.SEO_AUDIT_LIMIT || 0),
    report: process.env.SEO_AUDIT_REPORT || defaultReportPath,
    fail: process.env.SEO_AUDIT_NO_FAIL !== "1",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--base-url" && next) {
      args.baseUrl = next;
      index += 1;
    } else if (arg === "--site-origin" && next) {
      args.siteOrigin = next;
      index += 1;
    } else if (arg === "--limit" && next) {
      args.limit = Number(next);
      index += 1;
    } else if (arg === "--report" && next) {
      args.report = next;
      index += 1;
    } else if (arg === "--no-fail") {
      args.fail = false;
    }
  }

  args.baseUrl = args.baseUrl.replace(/\/+$/, "");
  args.siteOrigin = args.siteOrigin.replace(/\/+$/, "");
  return args;
}

function normalizeUrl(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    if (url.pathname !== "/" && url.pathname.endsWith("/")) {
      url.pathname = url.pathname.replace(/\/+$/, "");
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return value;
  }
}

function toLocalUrl(publicUrl, baseUrl) {
  const url = new URL(publicUrl);
  return `${baseUrl}${url.pathname}${url.search}`;
}

function toPublicUrl(localOrPath, siteOrigin) {
  const url = new URL(localOrPath, siteOrigin);
  return `${siteOrigin}${url.pathname}${url.search}${url.hash}`;
}

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function getAttributes(tag) {
  const attrs = {};
  for (const match of tag.matchAll(/([:\w-]+)\s*=\s*(["'])(.*?)\2/gis)) {
    attrs[match[1].toLowerCase()] = decodeEntities(match[3].trim());
  }
  return attrs;
}

function getMetaContent(html, key, attr = "name") {
  for (const match of html.matchAll(/<meta\b[^>]*>/gis)) {
    const attrs = getAttributes(match[0]);
    if ((attrs[attr] || "").toLowerCase() === key.toLowerCase()) {
      return attrs.content || "";
    }
  }
  return "";
}

function getLinkHref(html, rel) {
  for (const match of html.matchAll(/<link\b[^>]*>/gis)) {
    const attrs = getAttributes(match[0]);
    const rels = (attrs.rel || "").toLowerCase().split(/\s+/);
    if (rels.includes(rel.toLowerCase())) {
      return attrs.href || "";
    }
  }
  return "";
}

function getAlternates(html) {
  const alternates = {};
  for (const match of html.matchAll(/<link\b[^>]*>/gis)) {
    const attrs = getAttributes(match[0]);
    const rels = (attrs.rel || "").toLowerCase().split(/\s+/);
    const hreflang = attrs.hreflang?.toLowerCase();
    if (rels.includes("alternate") && hreflang && attrs.href) {
      alternates[hreflang] = attrs.href;
    }
  }
  return alternates;
}

function getTitle(html) {
  const match = html.match(/<title[^>]*>(.*?)<\/title>/is);
  return match ? decodeEntities(match[1].replace(/\s+/g, " ").trim()) : "";
}

function getHtmlLang(html) {
  const match = html.match(/<html\b[^>]*>/i);
  return match ? getAttributes(match[0]).lang || "" : "";
}

function getH1s(html) {
  return Array.from(html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gis)).map((match) => ({
    raw: match[1],
    text: decodeEntities(match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()),
  }));
}

function getIds(html) {
  return new Set(
    Array.from(html.matchAll(/\bid\s*=\s*(["'])(.*?)\1/gis)).map((match) => decodeEntities(match[2])),
  );
}

function getAnchors(html) {
  return Array.from(html.matchAll(/<a\b[^>]*>/gis)).map((match) => getAttributes(match[0]));
}

function getImages(html) {
  return Array.from(html.matchAll(/<img\b[^>]*>/gis)).map((match) => getAttributes(match[0]));
}

function getJsonLdScripts(html) {
  return Array.from(
    html.matchAll(/<script\b[^>]*type\s*=\s*(["'])application\/ld\+json\1[^>]*>([\s\S]*?)<\/script>/gis),
  ).map((match) => decodeEntities(match[2].trim()));
}

function getBodyHtml(html) {
  const match = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  return match ? match[1] : html;
}

function getVisibleTextRatio(html) {
  const body = getBodyHtml(html)
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, "")
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, "");
  const text = decodeEntities(body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
  const codeLength = body.replace(/\s+/g, " ").trim().length;

  return codeLength === 0 ? 0 : text.length / codeLength;
}

function getExpectedLocale(publicUrl) {
  const pathname = new URL(publicUrl).pathname;
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  return firstSegment === "pl" ? "pl" : "en";
}

async function fetchWithRedirects(url, maxRedirects = 8) {
  const chain = [];
  let currentUrl = url;

  for (let redirects = 0; redirects <= maxRedirects; redirects += 1) {
    const response = await fetch(currentUrl, {
      redirect: "manual",
      headers: {
        "user-agent": "TripTimiSeoAudit/1.0",
      },
    });
    const location = response.headers.get("location");
    chain.push({ url: currentUrl, status: response.status, location });

    if (!location || response.status < 300 || response.status >= 400) {
      return {
        chain,
        response,
      };
    }

    currentUrl = new URL(location, currentUrl).toString();
  }

  throw new Error(`Too many redirects for ${url}`);
}

function addIssue(pageReport, severity, code, message, detail = undefined) {
  pageReport.issues.push({
    severity,
    code,
    message,
    ...(detail ? { detail } : {}),
  });
}

function validateJsonLd(pageReport, html, ids, publicUrl) {
  const scripts = getJsonLdScripts(html);

  if (scripts.length === 0) {
    addIssue(pageReport, "warning", "jsonld_missing", "No JSON-LD script found.");
    return;
  }

  for (const [index, script] of scripts.entries()) {
    let parsed;
    try {
      parsed = JSON.parse(script);
    } catch (error) {
      addIssue(pageReport, "critical", "jsonld_invalid", `JSON-LD script ${index + 1} is not valid JSON.`, {
        error: error.message,
      });
      continue;
    }

    const nodes = Array.isArray(parsed?.["@graph"]) ? parsed["@graph"] : [parsed];
    for (const node of nodes) {
      const type = Array.isArray(node?.["@type"]) ? node["@type"].join(",") : node?.["@type"];
      if (["WebPage", "CollectionPage", "WebSite"].includes(type)) {
        for (const key of ["name", "description", "url"]) {
          if (!node[key]) {
            addIssue(pageReport, "warning", "jsonld_missing_field", `${type} JSON-LD is missing ${key}.`);
          }
        }
        if (!node.inLanguage) {
          addIssue(pageReport, "warning", "jsonld_missing_language", `${type} JSON-LD is missing inLanguage.`);
        }
      }

      const urlsToCheck = [node?.url, node?.["@id"], node?.item].filter(Boolean);
      for (const value of urlsToCheck) {
        const url = new URL(value, publicUrl);
        if (url.hash && normalizeUrl(url.toString()) === normalizeUrl(publicUrl)) {
          const anchorId = url.hash.slice(1);
          if (!ids.has(anchorId)) {
            addIssue(pageReport, "critical", "jsonld_broken_fragment", `JSON-LD points to missing #${anchorId}.`);
          }
        }
      }
    }
  }
}

function validatePage({ html, headers, publicUrl, sitemapUrls, siteOrigin }) {
  const pageReport = {
    url: publicUrl,
    title: getTitle(html),
    issues: [],
  };
  const ids = getIds(html);
  const canonical = getLinkHref(html, "canonical");
  const alternates = getAlternates(html);
  const expectedLocale = getExpectedLocale(publicUrl);
  const htmlLang = getHtmlLang(html);
  const metaRobots = getMetaContent(html, "robots");
  const xRobots = headers.get("x-robots-tag") || "";
  const description = getMetaContent(html, "description");
  const h1s = getH1s(html);
  const anchors = getAnchors(html);
  const images = getImages(html);
  const textToCodeRatio = getVisibleTextRatio(html);

  pageReport.canonical = canonical;
  pageReport.htmlLang = htmlLang;
  pageReport.alternates = alternates;
  pageReport.metrics = {
    textToCodeRatio: Number(textToCodeRatio.toFixed(3)),
  };

  if (htmlLang !== expectedLocale) {
    addIssue(pageReport, "critical", "html_lang_mismatch", `Expected html lang ${expectedLocale}, found ${htmlLang || "missing"}.`);
  }

  if (!canonical) {
    addIssue(pageReport, "critical", "canonical_missing", "Missing canonical link.");
  } else if (normalizeUrl(canonical) !== normalizeUrl(publicUrl)) {
    addIssue(pageReport, "critical", "canonical_mismatch", "Canonical does not match sitemap URL.", {
      canonical,
      expected: publicUrl,
    });
  }

  if (/noindex/i.test(metaRobots) || /noindex/i.test(xRobots)) {
    addIssue(pageReport, "critical", "noindex", "Page is marked noindex.", { metaRobots, xRobots });
  }

  if (/nofollow/i.test(metaRobots) || /nofollow/i.test(xRobots)) {
    addIssue(pageReport, "warning", "nofollow", "Page is marked nofollow.", { metaRobots, xRobots });
  }

  if (!description) {
    addIssue(pageReport, "critical", "description_missing", "Missing meta description.");
  }

  if (!pageReport.title) {
    addIssue(pageReport, "critical", "title_missing", "Missing title.");
  } else if (pageReport.title.length > 60) {
    addIssue(pageReport, "warning", "title_long", `Title is ${pageReport.title.length} characters.`);
  }

  for (const [key, attr] of [
    ["og:title", "property"],
    ["og:description", "property"],
    ["og:image", "property"],
    ["og:url", "property"],
    ["og:type", "property"],
    ["twitter:card", "name"],
    ["twitter:title", "name"],
    ["twitter:description", "name"],
    ["twitter:image", "name"],
  ]) {
    const value = getMetaContent(html, key, attr);
    if (!value) {
      addIssue(pageReport, "critical", "social_metadata_missing", `Missing ${key}.`);
    } else if ((key === "og:image" || key === "twitter:image") && !/^https:\/\//i.test(value)) {
      addIssue(pageReport, "critical", "social_image_not_absolute", `${key} is not an absolute HTTPS URL.`, { value });
    }
  }

  if (h1s.length !== 1) {
    addIssue(pageReport, "critical", "h1_count", `Expected one H1, found ${h1s.length}.`);
  } else if (/<[a-z][\s\S]*>/i.test(h1s[0].raw)) {
    addIssue(pageReport, "critical", "h1_nested_markup", "H1 contains nested markup.");
  }

  if (!alternates[expectedLocale]) {
    addIssue(pageReport, "critical", "hreflang_self_missing", `Missing self hreflang ${expectedLocale}.`);
  } else if (normalizeUrl(alternates[expectedLocale]) !== normalizeUrl(publicUrl)) {
    addIssue(pageReport, "critical", "hreflang_self_mismatch", `Self hreflang ${expectedLocale} does not match current URL.`, {
      href: alternates[expectedLocale],
    });
  }

  if (!alternates["x-default"]) {
    addIssue(pageReport, "critical", "hreflang_x_default_missing", "Missing x-default hreflang.");
  } else if (alternates.en && normalizeUrl(alternates["x-default"]) !== normalizeUrl(alternates.en)) {
    addIssue(pageReport, "critical", "hreflang_x_default_mismatch", "x-default does not point to the default English URL.", {
      href: alternates["x-default"],
      expected: alternates.en,
    });
  }

  for (const [locale, href] of Object.entries(alternates)) {
    if (locale === "x-default") {
      continue;
    }
    if (!sitemapUrls.has(normalizeUrl(href))) {
      addIssue(pageReport, "critical", "hreflang_not_in_sitemap", `hreflang ${locale} is not in sitemap.`, { href });
    }
  }

  for (const anchor of anchors) {
    const href = anchor.href || "";
    if (!href) {
      continue;
    }
    if (/^http:\/\//i.test(href)) {
      addIssue(pageReport, "warning", "http_link", "HTTP link found.", { href });
    }
    if (href.startsWith("#") && href.length > 1 && !ids.has(href.slice(1))) {
      addIssue(pageReport, "critical", "broken_jump_link", `Jump link points to missing ${href}.`);
    }
    if (/^(\/|https:\/\/triptimi\.com)/i.test(href)) {
      const linkUrl = new URL(href, publicUrl);
      const linkKey = normalizeUrl(toPublicUrl(`${linkUrl.pathname}${linkUrl.search}`, siteOrigin));
      const isUtilityRoute = linkUrl.pathname.startsWith("/go/") || linkUrl.pathname.startsWith("/api/");
      if (!isUtilityRoute && !linkUrl.search && !sitemapUrls.has(linkKey)) {
        addIssue(pageReport, "warning", "internal_link_not_in_sitemap", "Internal link target is not in sitemap.", {
          href,
        });
      }
    }
  }

  images.forEach((image, index) => {
    const alt = (image.alt || "").trim();
    if (!alt) {
      addIssue(pageReport, "warning", "image_alt_missing", "Image is missing alt text.", { src: image.src });
    } else if (alt.split(/\s+/).filter(Boolean).length < 2) {
      addIssue(pageReport, "warning", "image_alt_one_word", "Image alt text has only one word.", { alt, src: image.src });
    }

    if (!image.width || !image.height) {
      addIssue(pageReport, "warning", "image_dimensions_missing", "Image is missing width or height.", { src: image.src });
    }

    if (index > 1 && image.loading !== "lazy") {
      addIssue(pageReport, "notice", "image_lazy_missing", "Non-leading image is not marked loading=lazy.", {
        src: image.src,
      });
    }
  });

  if (textToCodeRatio < 0.1) {
    addIssue(pageReport, "notice", "text_to_code_ratio_low", `Visible text to HTML ratio is ${pageReport.metrics.textToCodeRatio}.`);
  }

  if (!/<(?:ul|ol)\b/i.test(html)) {
    addIssue(pageReport, "notice", "list_markup_missing", "No list markup found in rendered HTML.");
  }

  if (!/<(?:strong|em)\b/i.test(html)) {
    addIssue(pageReport, "notice", "strong_emphasis_missing", "No strong or emphasis markup found in rendered HTML.");
  }

  validateJsonLd(pageReport, html, ids, publicUrl);

  return pageReport;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sitemapUrls = await collectSitemapUrls(`${args.baseUrl}/sitemap.xml`, args);
  const sitemapUrlSet = new Set(sitemapUrls);
  const crawlUrls = args.limit > 0 ? sitemapUrls.slice(0, args.limit) : sitemapUrls;
  const reports = [];
  const siteIssues = [];

  for (const header of securityHeaders) {
    const response = await fetch(`${args.baseUrl}/`, {
      headers: {
        "user-agent": "TripTimiSeoAudit/1.0",
      },
    });
    if (!response.headers.get(header)) {
      siteIssues.push({
        severity: "critical",
        code: "security_header_missing",
        message: `Missing ${header} on homepage.`,
      });
    }
  }

  for (const [index, publicUrl] of crawlUrls.entries()) {
    const localUrl = toLocalUrl(publicUrl, args.baseUrl);
    const pageReport = {
      url: publicUrl,
      localUrl,
      issues: [],
    };

    try {
      const { chain, response } = await fetchWithRedirects(localUrl);
      pageReport.status = response.status;
      pageReport.redirectChain = chain;

      if (chain.length > 1) {
        addIssue(pageReport, "warning", "redirect_chain", "Sitemap URL redirects locally.", { chain });
      }

      if (response.status !== 200) {
        addIssue(pageReport, "critical", "status_not_200", `Expected 200, got ${response.status}.`);
      } else {
        const html = await response.text();
        const validated = validatePage({
          html,
          headers: response.headers,
          publicUrl,
          sitemapUrls: sitemapUrlSet,
          siteOrigin: args.siteOrigin,
        });
        Object.assign(pageReport, validated);
      }
    } catch (error) {
      addIssue(pageReport, "critical", "fetch_error", error.message);
    }

    reports.push(pageReport);

    if ((index + 1) % 100 === 0 || index + 1 === crawlUrls.length) {
      console.log(`Audited ${index + 1}/${crawlUrls.length} pages`);
    }
  }

  const issueCounts = {};
  const severityCounts = {};
  const allIssues = [
    ...siteIssues,
    ...reports.flatMap((report) => report.issues),
  ];

  for (const issue of allIssues) {
    issueCounts[issue.code] = (issueCounts[issue.code] || 0) + 1;
    severityCounts[issue.severity] = (severityCounts[issue.severity] || 0) + 1;
  }

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: args.baseUrl,
    siteOrigin: args.siteOrigin,
    sitemapUrlCount: sitemapUrls.length,
    crawledUrlCount: crawlUrls.length,
    severityCounts,
    issueCounts,
    siteIssues,
    pages: reports,
  };

  await mkdir(path.dirname(args.report), { recursive: true });
  await writeFile(args.report, `${JSON.stringify(report, null, 2)}\n`);

  console.log(`SEO audit report written to ${args.report}`);
  console.log(`Issue counts: ${JSON.stringify(issueCounts)}`);

  if (args.fail && (severityCounts.critical || 0) > 0) {
    process.exitCode = 1;
  }
}

async function collectSitemapUrls(sitemapUrl, args, seen = new Set()) {
  const localSitemapUrl = sitemapUrl.startsWith(args.baseUrl)
    ? sitemapUrl
    : toLocalUrl(sitemapUrl, args.baseUrl);

  if (seen.has(localSitemapUrl)) {
    return [];
  }

  seen.add(localSitemapUrl);

  const sitemapResponse = await fetch(localSitemapUrl, {
    headers: {
      "user-agent": "TripTimiSeoAudit/1.0",
    },
  });

  if (!sitemapResponse.ok) {
    throw new Error(`Could not fetch sitemap ${localSitemapUrl}: ${sitemapResponse.status}`);
  }

  const sitemapXml = await sitemapResponse.text();
  const locs = Array.from(sitemapXml.matchAll(/<loc>(.*?)<\/loc>/gis)).map((match) =>
    normalizeUrl(decodeEntities(match[1].trim())),
  );

  if (/<sitemapindex\b/i.test(sitemapXml)) {
    const nested = await Promise.all(locs.map((loc) => collectSitemapUrls(loc, args, seen)));
    return nested.flat();
  }

  return locs;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
