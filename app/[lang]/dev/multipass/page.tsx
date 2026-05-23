import { locales } from "@/lib/locales";
import MultipassDevPageClient from "./page-client";

export function generateStaticParams() {
	return locales.map((lang) => ({ lang }));
}

export default function MultipassDevPage() {
	return <MultipassDevPageClient />;
}
