'use strict';

const obsidian = require('obsidian');

/**
 * Clipping Note
 *
 * Chová se stejně jako jádrové pluginy Daily Note a Unique Note (zk-prefixer):
 *  - přidá ikonku do postranního panelu (ribbon)
 *  - po kliknutí vytvoří soubor .md ve složce "Clippings"
 *  - jméno souboru: "Clipping " + datum/čas ve formátu D. M. Y HH-mm
 *    (např. "Clipping 10. 6. 2026 21-04")
 *  - obsah se naplní ze šablony -Template/Clipping Template
 *    a zpracují se zástupné výrazy {{date}}, {{date:FORMAT}},
 *    {{time}}, {{time:FORMAT}} a {{title}} — stejně jako u jádrových pluginů.
 */

// Výchozí nastavení – jde upravit v Nastavení → Clipping Note.
const DEFAULT_SETTINGS = {
	folder: 'Clippings',
	template: '-Template/Clipping Template',
	// Formát data/času v názvu souboru (moment.js). HH-mm místo HH:mm,
	// protože dvojtečka není v názvech souborů povolená.
	format: 'D. M. Y HH-mm',
	prefix: 'Clipping ',
};

class ClippingNotePlugin extends obsidian.Plugin {
	async onload() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

		// Ikonka v postranním panelu (ribbon).
		this.addRibbonIcon('scissors', 'Vytvořit Clipping poznámku', async () => {
			await this.createClippingNote();
		});

		// Příkaz do command palette (Ctrl/Cmd+P).
		this.addCommand({
			id: 'create-clipping-note',
			name: 'Vytvořit Clipping poznámku',
			callback: async () => {
				await this.createClippingNote();
			},
		});

		this.addSettingTab(new ClippingNoteSettingTab(this.app, this));
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async createClippingNote() {
		try {
			const folderPath = normalizePath(this.settings.folder);
			await this.ensureFolder(folderPath);

			const now = obsidian.moment();
			const baseName = `${this.settings.prefix}${now.format(this.settings.format)}`;
			const filePath = await this.getAvailablePath(folderPath, baseName);

			const content = await this.buildContent(baseName);

			const file = await this.app.vault.create(filePath, content);

			// Otevři novou poznámku v aktivním panelu.
			const leaf = this.app.workspace.getLeaf(false);
			await leaf.openFile(file);
		} catch (err) {
			console.error('Clipping Note:', err);
			new obsidian.Notice('Clipping Note: nepodařilo se vytvořit poznámku – ' + err.message);
		}
	}

	async ensureFolder(folderPath) {
		if (!folderPath) return;
		const existing = this.app.vault.getAbstractFileByPath(folderPath);
		if (!existing) {
			await this.app.vault.createFolder(folderPath);
		}
	}

	// Vrátí volnou cestu; pokud soubor existuje, přidá " 1", " 2", ...
	async getAvailablePath(folderPath, baseName) {
		const join = (name) => normalizePath(folderPath ? `${folderPath}/${name}` : name) + '.md';
		let candidate = join(baseName);
		let i = 1;
		while (this.app.vault.getAbstractFileByPath(candidate)) {
			candidate = join(`${baseName} ${i}`);
			i++;
		}
		return candidate;
	}

	async buildContent(title) {
		const templatePath = normalizePath(this.settings.template) + '.md';
		const templateFile = this.app.vault.getAbstractFileByPath(templatePath);

		let raw = '';
		if (templateFile instanceof obsidian.TFile) {
			raw = await this.app.vault.read(templateFile);
		} else if (this.settings.template) {
			new obsidian.Notice(`Clipping Note: šablona "${templatePath}" nenalezena, vytvářím prázdnou poznámku.`);
		}

		return this.applyTemplate(raw, title);
	}

	// Zpracuje zástupné výrazy stejně jako jádrové pluginy Obsidianu.
	applyTemplate(text, title) {
		const now = obsidian.moment();

		return text
			.replace(/{{\s*title\s*}}/gi, title)
			.replace(/{{\s*date\s*:([^}]+)}}/gi, (_, fmt) => now.format(fmt.trim()))
			.replace(/{{\s*time\s*:([^}]+)}}/gi, (_, fmt) => now.format(fmt.trim()))
			.replace(/{{\s*date\s*}}/gi, now.format('YYYY-MM-DD'))
			.replace(/{{\s*time\s*}}/gi, now.format('HH:mm'));
	}
}

class ClippingNoteSettingTab extends obsidian.PluginSettingTab {
	constructor(app, plugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		const { containerEl } = this;
		containerEl.empty();

		new obsidian.Setting(containerEl)
			.setName('Cílová složka')
			.setDesc('Kam se ukládají nové Clipping poznámky.')
			.addText((text) =>
				text
					.setPlaceholder('Clippings')
					.setValue(this.plugin.settings.folder)
					.onChange(async (value) => {
						this.plugin.settings.folder = value.trim();
						await this.plugin.saveSettings();
					})
			);

		new obsidian.Setting(containerEl)
			.setName('Šablona')
			.setDesc('Cesta k souboru šablony (bez přípony .md).')
			.addText((text) =>
				text
					.setPlaceholder('-Template/Clipping Template')
					.setValue(this.plugin.settings.template)
					.onChange(async (value) => {
						this.plugin.settings.template = value.trim();
						await this.plugin.saveSettings();
					})
			);

		new obsidian.Setting(containerEl)
			.setName('Formát názvu (datum/čas)')
			.setDesc('Formát moment.js použitý za prefixem. Dvojtečku v čase nahraď pomlčkou.')
			.addText((text) =>
				text
					.setPlaceholder('D. M. Y HH-mm')
					.setValue(this.plugin.settings.format)
					.onChange(async (value) => {
						this.plugin.settings.format = value.trim();
						await this.plugin.saveSettings();
					})
			);

		new obsidian.Setting(containerEl)
			.setName('Prefix názvu')
			.setDesc('Text před datem v názvu souboru.')
			.addText((text) =>
				text
					.setPlaceholder('Clipping ')
					.setValue(this.plugin.settings.prefix)
					.onChange(async (value) => {
						this.plugin.settings.prefix = value;
						await this.plugin.saveSettings();
					})
			);
	}
}

function normalizePath(path) {
	if (typeof obsidian.normalizePath === 'function') {
		return obsidian.normalizePath(path);
	}
	return path.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\/|\/$/g, '');
}

module.exports = ClippingNotePlugin;
