import { buildHomeMetadata, LocalizedHomePage } from "@/components/localized-home-page";
import { defaultLocale } from "@/lib/i18n";

export const metadata = buildHomeMetadata(defaultLocale);

export default function Home() {
  return <LocalizedHomePage locale={defaultLocale} />;
}
