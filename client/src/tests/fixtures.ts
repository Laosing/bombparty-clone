import SuperJSON from "superjson"

// Programmatically construct the Room fixtures so they can be
// serialized with SuperJSON.serialize(...) and later restored by
// `deserialize` (which calls `SuperJSON.deserialize`). Avoid serializing
// functions — tests only need the data shape (Maps/Sets/users/winner).

const roomDefault = new Map<string, any>([
	[
		"messages",
		new Set<any>()
	],
	[
		"users",
		new Map([
			[
				"l17oMihmvHzmZFYyVrSFo",
				{ id: "l17oMihmvHzmZFYyVrSFo", name: "vast-wildcat", avatar: "Ibrlt0Gye2bhvQXSuzi0u", inGame: false, group: "" }
			]
		])
	],
	["groups", new Map()],
	["words", new Set()],
	["letterBlend", ""],
	["letterBlendWord", ""],
	["letterBlendCounter", 0],
	// timerConstructor: use a plain object placeholder (no functions)
	["timerConstructor", {}],
	["timer", 0],
	["round", 0],
	["hardMode", false],
	["currentGroup", ""],
	["startingPlayer", ""],
	["running", false],
	["winner", null],
	["settings", new Map<string, any>([["timer", 10], ["lives", 2], ["hardMode", 5], ["hardModeEnabled", true], ["letterBlendCounter", 2]])],
	["private", false],
	["isCountDown", false]
])

const roomWithWinner = new Map<string, any>([
	[
		"messages",
		new Set([
			{ id: "aZSosJXQsYGHHDUul8yHp", user: { name: "" }, value: "vast-wildcat joined the game", time: 1661602008678 },
			{ id: "99FkZLq9Uc1kWogDca9_L", user: { name: "" }, value: "vast-wildcat changed the settings", time: 1661602016370 },
			{ id: "DG0O-un8_iPULkFCXdzSd", user: { name: "" }, value: "vast-wildcat started the game", time: 1661602017342 },
			{ id: "fCNFa0g2jXg4ZJ6Jt9LmR", user: { name: "" }, value: "vast-wildcat immediately started the game", time: 1661602017551 }
		])
	],
	[
		"users",
		new Map([
			[
				"l17oMihmvHzmZFYyVrSFo",
				{ id: "l17oMihmvHzmZFYyVrSFo", name: "vast-wildcat", avatar: "OiiAJouwz7fQLN3ko0WgO", inGame: true, group: "vGtOnPTNj8x6mHTnfIyHS", score: 0 }
			]
		])
	],
	[
		"groups",
		new Map([
			[
				"vGtOnPTNj8x6mHTnfIyHS",
				{ id: "vGtOnPTNj8x6mHTnfIyHS", letters: new Set(), score: 1, bonusLetters: new Set(), members: new Set(["l17oMihmvHzmZFYyVrSFo"]), lives: 0, text: "", letterBlend: "et" }
			]
		])
	],
	["words", new Set()],
	["letterBlend", "et"],
	["letterBlendWord", "shet"],
	["letterBlendCounter", 2],
	["timerConstructor", {}],
	["timer", 0],
	["round", 1],
	["hardMode", false],
	["currentGroup", ""],
	["startingPlayer", "vGtOnPTNj8x6mHTnfIyHS"],
	["running", false],
	[
		"winner",
		{ id: "vGtOnPTNj8x6mHTnfIyHS", letters: new Set(), score: 0, bonusLetters: new Set(), members: new Set(["l17oMihmvHzmZFYyVrSFo"]), lives: 0, text: "", letterBlend: "et" }
	],
	["settings", new Map<string, any>([["timer", 1], ["lives", 1], ["hardMode", 5], ["hardModeEnabled", true], ["letterBlendCounter", 2]])],
	["private", false],
	["isCountDown", false],
	["_countDownInterval", 249]
])

export const roomDefaultData = SuperJSON.serialize(roomDefault)
export const roomWithWinnerData = SuperJSON.serialize(roomWithWinner)
