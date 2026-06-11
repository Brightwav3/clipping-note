'use strict';

const obsidian = require('obsidian');

/**
 * Clipping Note
 *
 * Works like the core Daily Note and Unique Note (zk-prefixer) plugins:
 *  - adds an icon to the sidebar ribbon
 *  - on click, creates a .md file in the "Clippings" folder
 *  - filename: "Clipping " + date/time formatted as D. M. Y HH-mm
 *    (e.g. "Clipping 10. 6. 2026 21-04")
 *  - the body is filled from the -Template/Clipping Template template,
 *    processing the {{date}}, {{date:FORMAT}}, {{time}}, {{time:FORMAT}}
 *    and {{title}} placeholders — just like the core plugins.
 *
 * The interface is in English by default; Czech localization can be
 * enabled in Settings → Clipping Note.
 */

// UI strings. Ribbon and command labels are read once on load, so changing
// the language takes effect for them only after Obsidian is reloaded.
const TRANSLATIONS = {
	en: {
		ribbonTooltip: 'Create Clipping note',
		commandName: 'Create Clipping note',
		createFailed: (msg) => `Clipping Note: could not create the note – ${msg}`,
		templateMissing: (path) => `Clipping Note: template "${path}" not found, creating an empty note.`,
		folderName: 'Target folder',
		folderDesc: 'Where new Clipping notes are saved.',
		templateName: 'Template',
		templateDesc: 'Path to the template file (without the .md extension).',
		formatName: 'Filename format (date/time)',
		formatDesc: 'moment.js format used after the prefix. Replace the colon in the time with a hyphen.',
		prefixName: 'Filename prefix',
		prefixDesc: 'Text before the date in the filename.',
		languageName: 'Czech localization',
		languageDesc: 'Switch the interface to Czech. Ribbon and command labels update after reloading Obsidian.',
	},
	cs: {
		ribbonTooltip: 'Vytvořit Clipping poznámku',
		commandName: 'Vytvořit Clipping poznámku',
		createFailed: (msg) => `Clipping Note: nepodařilo se vytvořit poznámku – ${msg}`,
		templateMissing: (path) => `Clipping Note: šablona "${path}" nenalezena, vytvářím prázdnou poznámku.`,
		folderName: 'Cílová složka',
		folderDesc: 'Kam se ukládají nové Clipping poznámky.',
		templateName: 'Šablona',
		templateDesc: 'Cesta k souboru šablony (bez přípony .md).',
		formatName: 'Formát názvu (datum/čas)',
		formatDesc: 'Formát moment.js použitý za prefixem. Dvojtečku v čase nahraď pomlčkou.',
		prefixName: 'Prefix názvu',
		prefixDesc: 'Text před datem v názvu souboru.',
		languageName: 'Česká lokalizace',
		languageDesc: 'Přepne rozhraní do češtiny. Popisky v panelu a paletě se aktualizují po restartu Obsidianu.',
	},
};

// Default settings – editable in Settings → Clipping Note.
const DEFAULT_SETTINGS = {
	folder: 'Clippings',
	template: '-Template/Clipping Template',
	// Date/time format in the filename (moment.js). HH-mm instead of HH:mm,
	// because a colon is not allowed in filenames.
	format: 'D. M. Y HH-mm',
	prefix: 'Clipping ',
	// Interface language: 'en' (default) or 'cs'.
	language: 'en',
};

class ClippingNotePlugin extends obsidian.Plugin {
	async onload() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

		// Sidebar ribbon icon.
		this.addRibbonIcon('scissors', this.t('ribbonTooltip'), async () => {
			await this.createClippingNote();
		});

		// Command palette entry (Ctrl/Cmd+P).
		this.addCommand({
			id: 'create-clipping-note',
			name: this.t('commandName'),
			callback: async () => {
				await this.createClippingNote();
			},
		});

		this.addSettingTab(new ClippingNoteSettingTab(this.app, this));
	}

	// Returns a localized string; if the entry is a function, call it with args.
	t(key, ...args) {
		const lang = TRANSLATIONS[this.settings.language] ? this.settings.language : 'en';
		const value = TRANSLATIONS[lang][key];
		return typeof value === 'function' ? value(...args) : value;
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

			// Open the new note in the active pane.
			const leaf = this.app.workspace.getLeaf(false);
			await leaf.openFile(file);
		} catch (err) {
			console.error('Clipping Note:', err);
			new obsidian.Notice(this.t('createFailed', err.message));
		}
	}

	async ensureFolder(folderPath) {
		if (!folderPath) return;
		const existing = this.app.vault.getAbstractFileByPath(folderPath);
		if (!existing) {
			await this.app.vault.createFolder(folderPath);
		}
	}

	// Returns a free path; if the file already exists, appends " 1", " 2", ...
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
			new obsidian.Notice(this.t('templateMissing', templatePath));
		}

		return this.applyTemplate(raw, title);
	}

	// Processes placeholders the same way as Obsidian's core plugins.
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
		const t = (key, ...args) => this.plugin.t(key, ...args);
		containerEl.empty();

		new obsidian.Setting(containerEl)
			.setName(t('folderName'))
			.setDesc(t('folderDesc'))
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
			.setName(t('templateName'))
			.setDesc(t('templateDesc'))
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
			.setName(t('formatName'))
			.setDesc(t('formatDesc'))
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
			.setName(t('prefixName'))
			.setDesc(t('prefixDesc'))
			.addText((text) =>
				text
					.setPlaceholder('Clipping ')
					.setValue(this.plugin.settings.prefix)
					.onChange(async (value) => {
						this.plugin.settings.prefix = value;
						await this.plugin.saveSettings();
					})
			);

		new obsidian.Setting(containerEl)
			.setName(t('languageName'))
			.setDesc(t('languageDesc'))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.language === 'cs')
					.onChange(async (value) => {
						this.plugin.settings.language = value ? 'cs' : 'en';
						await this.plugin.saveSettings();
						// Re-render the tab so the visible labels update immediately.
						this.display();
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
