const cheerio = require("cheerio");
const axios = require("axios");

async function torrent1337x(
	query = "",
	page = "1",
	sortby = "",
	sortorder = ""
) {
	const allTorrent = [];

	let isSort =
		(["time", "size", "seeders" , "leechers"].includes(sortby) &&
			["asc" || "desc"].includes(sortorder) &&
			true) ||
		false;
	let html;
	const url =
		`https://1337xx.to/${isSort ? "sort-" : ""}search/` +
		query +
		"/" +
		(isSort ? sortby + "/" + sortorder + "/" : "") +
		page +
		"/";
	try {
		html = await axios.get(url);
	} catch {
		return null;
	}

	const $ = cheerio.load(html.data);

	const links = $("td.name")
		.map((_, element) => {
			var link = "https://1337xx.to" + $(element).find("a").next().attr("href");
			return link;
		})
		.get();

	const totalPages = $(".pagination ul li:last-child a").text().trim();
	const currentPage = $(".pagination ul li.active a").text().trim();

	await Promise.all(
		links.map(async (element) => {
			const data = {};
			const labels = [
				"Category",
				"Type",
				"Language",
				"Size",
				"UploadedBy",
				"Downloads",
				"LastChecked",
				"DateUploaded",
				"Seeders",
				"Leechers",
			];
			let html;
			try {
				html = await axios.get(element);
			} catch {
				return null;
			}
			const $ = cheerio.load(html.data);
			data.name = $(".box-info-heading h1").text().trim();
			let magnetVal;
			$(".clearfix ul li a").each((_idx, el) => {
				const magnet = el.attributes.find(
					(i) => i.name === "href" && i.value.startsWith("magnet:")
				);
				if (magnet) {
					magnetVal = magnet.value;
				}
			});
			data.magnet = magnetVal; // $('.clearfix ul li a').attr('href') || "";
			const poster = $("div.torrent-image img").attr("src");

			if (typeof poster !== "undefined") {
				if (poster.startsWith("http")) {
					data.poster = poster;
				} else {
					data.poster = "https://1337xx.to" + poster;
				}
			} else {
				data.poster = "";
			}

			$("div .clearfix ul li > span").each((i, element) => {
				$list = $(element);
				data[labels[i].toLowerCase()] = $list.text();
			});
			data.url = element;

			allTorrent.push(data);
		})
	);
	const res = {
		items: allTorrent,
		page: Number(currentPage) || 0,
		totalPages: Number(totalPages) || 0,
		sortby,
		sortorder,
	};
	return res;
}
module.exports = {
	torrent1337x: torrent1337x,
};
