const json = {
	name: {
		jp: "中野 将生",
		en: "Nakano Masaki"
	},
	home: {
		country: "Japan",
		pref: "Kagawa",
		city: "Takamatsu"
	},
	belongs: {
		type: "univ",
		name: "University of Tsukuba",
		faculty: "School of Informatics",
		cource: "College of Information Science"
	},
	skill: {
		tech: {
			lang: {
				often_use: ["Rust", "Python"],
				sometime: ["D", "OCaml", "SystemVerilog", "C++", "C"]
			},
			os: ["Arch Linux", "Ubuntu"],
			cad: ["KiCAD", "Inventor"],
			editor: "NeoVim",
			tools: ["TeX", "Git"],
			frameworks: ["numpy", "react.js"],
			mathematics: "average B2",
			microcontroller: ["STM32"]
		},
		language: [
			{
				name: "Japanese",
				level: "native"
			},
			{
				name: "English",
				level: ["CEFR A2", "TOEIC 765"]
			}
		],
		certificates: [
			"TOEIC L&R 765",
			"応用情報技術者試験(Applied Information Technology Engineer Examination)"
		]
	},
	academic: {
		major: "System Frontend/Backend; Audio Signal Processing",
		papers: [],
	},
	personal_works: {
		namaco: {
			desc: "Morphological analyzer written in Rust",
			url: "https://github.com/namachan10777/namaco"
		},
		folivora: {
			desc: "Ergonomics keyboard",
			url: "https://github.com/namachan10777/namaco"
		}
  },
	accounts: {
		Twitter: "https://twitter.com/namachan10777",
		hatenablog: "https://namachan10777.hatenablog.com",
		GitHub: "https://github.com/namachan10777",
		Steam: "https://steamcommunity.com/id/namachan10777",
		Pixiv: "https://www.pixiv.net/member.php?id=16972899"
	},
  other_contents: {
    namecard: "https://namachan10777.github.io/namecard/namecard.html"
  },
	hobby: {
		languages: ["English", "Chinese"],
		travel: ["Camp", "Cycling"]
	},
	email: "namachan10777@gmail.com",
	amazon_wishlist: "http://amzn.asia/6JUD39R"
}

console.log(json);
document.getElementById('refuse');
const indentSize = 2;

function genSpan(content, classes) {
  const el = document.createElement('span');
  el.textContent = content;
  el.classList = classes;
  return el;
}

function genBr() {
  return document.createElement('br');
}

function genPre(content) {
  const el = document.createElement('pre');
  el.textContent = content;
  return el;
}

function genSpace(size) {
  const el = document.createElement('span');
  el.style.cssText = 'margin-right: ' + size + 'em';
  return el;
}

function genA(text, url) {
  const el = document.createElement('a');
  el.textContent = text;
  el.href = url;
  return el;
}

function buildPrettyPrint(json, indent=0) {
  if (Array.isArray(json)) {
    var children = [];
    const keys = Object.keys(json);
    children.push(genSpan('[', []));
    children.push(genBr());
    for (let i=0; i < keys.length; ++i) {
      children.push(genSpace(indent+indentSize));
      children = children.concat(buildPrettyPrint(json[keys[i]], indent + indentSize));
    }
    children.push(genSpace(indent));
    children.push(genSpan(']', []));
    children.push(genSpan(',', []));
    children.push(genBr());
    return children;
  }
  else if ('object' == typeof json) {
    var children = [];
    const keys = Object.keys(json);
    children.push(genSpan('{', []));
    children.push(genBr());
    for (let i=0; i < keys.length; ++i) {
      children.push(genSpace(indent+indentSize));
      children.push(genSpan(keys[i], []));
      children.push(genSpan(':', []));
      children = children.concat(buildPrettyPrint(json[keys[i]], indent+indentSize));
    }
    children.push(genSpace(indent));
    children.push(genSpan('}', []));
    children.push(genSpan(',', []));
    children.push(genBr());
    return children;
  }
  else if ('string' == typeof json) {
    if (RegExp('^(https?|ftp)(:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+)$').test(json)){
      return [genA('"' + json + '"', json), genSpan(',', []), genBr()];
    }
    else {
      return [genSpan('"' + json + '"', ['string']), genSpan(',', []), genBr()];
    }
  }
  else if ('number' == typeof json) {
    return [genSpan(json, []), genSpan(',', []), genBr()];
  }
}


const refuseBtn  =  document.getElementById('refuse');
const requestTxt = document.getElementById('request');
const root       = document.getElementById('root');

const children = buildPrettyPrint(json);
for (let i=0; i < children.length; ++i) {
  root.appendChild(children[i]);
}
