import { unstable_cache } from "next/cache";
import type en from "./en.json";

export type Dictionary = typeof en;

const dictionaries = {
	af: () => import("./af.json").then((module) => module.default),
	am: () => import("./am.json").then((module) => module.default),
	ar: () => import("./ar.json").then((module) => module.default),
	az: () => import("./az.json").then((module) => module.default),
	bg: () => import("./bg.json").then((module) => module.default),
	bn: () => import("./bn.json").then((module) => module.default),
	bs: () => import("./bs.json").then((module) => module.default),
	cs: () => import("./cs.json").then((module) => module.default),
	co: () => import("./co.json").then((module) => module.default),
	zh: () => import("./zh.json").then((module) => module.default),
	en: () => import("./en.json").then((module) => module.default),
	es: () => import("./es.json").then((module) => module.default),
	ha: () => import("./ha.json").then((module) => module.default),
	hu: () => import("./hu.json").then((module) => module.default),
	ja: () => import("./ja.json").then((module) => module.default),
	ko: () => import("./ko.json").then((module) => module.default),
	km: () => import("./km.json").then((module) => module.default),
	ms: () => import("./ms.json").then((module) => module.default),
	nl: () => import("./nl.json").then((module) => module.default),
	pt: () => import("./pt.json").then((module) => module.default),
	ps: () => import("./ps.json").then((module) => module.default),
	ru: () => import("./ru.json").then((module) => module.default),
	rw: () => import("./rw.json").then((module) => module.default),
	sk: () => import("./sk.json").then((module) => module.default),
	sl: () => import("./sl.json").then((module) => module.default),
	sr: () => import("./sr.json").then((module) => module.default),
	so: () => import("./so.json").then((module) => module.default),
	sw: () => import("./sw.json").then((module) => module.default),
	id: () => import("./id.json").then((module) => module.default),
	de: () => import("./de.json").then((module) => module.default),
	el: () => import("./el.json").then((module) => module.default),
	th: () => import("./th.json").then((module) => module.default),
	tl: () => import("./tl.json").then((module) => module.default),
	pl: () => import("./pl.json").then((module) => module.default),
	fa: () => import("./fa.json").then((module) => module.default),
	fr: () => import("./fr.json").then((module) => module.default),
	gu: () => import("./gu.json").then((module) => module.default),
	vi: () => import("./vi.json").then((module) => module.default),
	tr: () => import("./tr.json").then((module) => module.default),
	yo: () => import("./yo.json").then((module) => module.default),
	ur: () => import("./ur.json").then((module) => module.default),
	uz: () => import("./uz.json").then((module) => module.default),
	hi: () => import("./hi.json").then((module) => module.default),
	my: () => import("./my.json").then((module) => module.default),
	ro: () => import("./ro.json").then((module) => module.default),
	it: () => import("./it.json").then((module) => module.default),
	fi: () => import("./fi.json").then((module) => module.default),
	lt: () => import("./lt.json").then((module) => module.default),
	lv: () => import("./lv.json").then((module) => module.default),
	uk: () => import("./uk.json").then((module) => module.default),
} as const;

const DEFAULT_LOCALE: keyof typeof dictionaries = "en";

export const getDictionary = unstable_cache(
	async (locale: string) => {
		const hasLocale = locale in dictionaries;
		const actualLocale = (
			hasLocale ? locale : DEFAULT_LOCALE
		) as keyof typeof dictionaries;
		const loader = dictionaries[actualLocale];
		return loader();
	},
	["dictionary"],
	{ revalidate: 86400 },
);

// Export locales for static generation
export const locales = Object.keys(dictionaries);
