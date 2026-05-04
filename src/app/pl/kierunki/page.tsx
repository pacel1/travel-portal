import {
  buildDestinationsMetadata,
  DestinationsIndex,
} from "@/components/destinations-index";

export const metadata = buildDestinationsMetadata("pl");

export default function PolishDestinationsPage() {
  return <DestinationsIndex locale="pl" />;
}
