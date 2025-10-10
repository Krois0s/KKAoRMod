document.addEventListener('DOMContentLoaded', () => {
    // HTML要素を取得
    const fileInput = document.getElementById('fileInput');
    const editorArea = document.getElementById('editor-area');
    const npcSelector = document.getElementById('npcSelector');
    const jsonEditor = document.getElementById('jsonEditor');
    const saveButton = document.getElementById('saveButton');
    const npcSearch = document.getElementById('npcSearch');
    const individualForm = document.getElementById('individual-editor-form');
    const reloadButton = document.getElementById('reloadButton'); // リロードボタンの追加
    const traitsList = document.getElementById('traits-list');
    const addTraitButton = document.getElementById('add-trait-button');
    const umaEditorContainer = document.getElementById('uma-editor-container');
    const equipsEditorContainer = document.getElementById('equips-editor-container');
    const equipsList = document.getElementById('equips-list');
    const umaEditorForm = document.getElementById('uma-editor-form');
    const umaUnavailableMessage = document.getElementById('uma-unavailable-message');
    const savePresetButton = document.getElementById('save-preset-button');
    const loadPresetInput = document.getElementById('load-preset-input');
    const enableJsonEdit = document.getElementById('enableJsonEdit');
    const dragOverlay = document.getElementById('drag-overlay');
    const langJaButton = document.getElementById('lang-ja');
    const langEnButton = document.getElementById('lang-en');
    const dataDependentControls = document.getElementById('data-dependent-controls');
    const dataDependentControlsBottom = document.getElementById('data-dependent-controls-bottom');
    const fileNameDisplay = document.getElementById('file-name-display');

    // 読み込んだセーブデータ全体を保持
    let fullSaveData = null;
    let loadedFileObject = null; // 読み込んだFileオブジェクトを保持する
    let originalFileName = 'save_edited.dat';
    let currentNpcOriginalData = null; // 選択中のNPCの初期データを保持
    let currentNpcOriginalUmaDna = null; // 選択中のNPCの初期UMA DNAデータを保持
    let currentNpcIndex = null; // 現在選択/編集中のNPCのインデックス
    let isUpdatingFromJson = false; // JSONエディタからの更新中フラグ
    let currentLang = 'ja'; // 現在の言語

    let traitData = null; // traits.jsonから読み込んだデータを保持
    let traitDatalist; // Trait選択候補の<datalist>要素
    // ★★★ 多言語対応リソース ★★★
    const i18n = {
        ja: {
            // HTML内の静的テキスト
            page_title: "Age of Reforging : TF キャラクターエディタ",
            title: "Age of Reforging : TF キャラクターエディタ",
            important_notes_title: "【重要】利用上の注意",
            important_backup_and_disclaimer: "・編集前に必ずセーブデータのバックアップを取ってください、セーブデータの破損について一切の責任を負いません。",
            important_unknown_effects: "・各項目の変更がゲームに与える影響は未知数です。予期せぬ動作を引き起こす可能性があります。",
            important_no_official_contact: "・このツールで編集したセーブデータに起因する不具合について、公式開発元へのお問い合わせは絶対に行わないでください。",
            important_bug_report: "・<a href=\"https://steamcommunity.com/sharedfiles/filedetails/?id=3578740904\" target=\"_blank\" data-i18n=\"bug_report_link\">不具合報告</a>は<del>私がAoRに飽きるまで</del>歓迎します",
            bug_report_link: "不具合報告",
            load_instruction: "下記のセーブデータを読み込んでください。<br><code>C:\\Users\\<b><i>{ユーザー名}</i></b>\\AppData\\LocalLow\\PersonaeGames\\Age of Reforging The Freelands\\Save\\<b><i>{キャラクター名}</i></b>\\SaveData\\<b><i>{セーブデータ名}</i></b>\\sav.dat</code>",
            filter_npc_list_label: "NPCリストを絞り込み:",
            filter_npc_list_note: "(一部英名でないとヒットしないNPCがいます)",
            npc_select_label: "編集するNPCを選択:",
            traits_label: "Traits",
            add_trait_button: "Traitを追加",
            equips_label: "装備品",
            appearance_label: "外見 (UMA DNA)",
            save_preset_button: "外見をプリセットとして保存",
            load_preset_button_label: "プリセットから外見を読み込み",
            load_preset_button: "プリセットから外見を読み込み",
            uma_unavailable_message: "このキャラクターは外見データを持っていません。",
            json_editor_label: "JSONデータ (変更非推奨):",
            enable_json_edit_button: "編集を有効にする",
            save_button: "編集内容をファイルに保存",
            reload_button: "変更を破棄してリロード",
            drop_hint: "（sav.datをドラッグ＆ドロップでも開けます）",
            select_file_button: "ファイルを選択",
            no_file_selected: "選択されていません",
            // 動的生成UI
            group_profile: 'プロフィール',
            group_attributes: '基礎能力値 (Attributes)',
            group_talents: 'タレント (Talents)',
            group_status: 'ステータス',
            label_unitname: '名前',
            label_gender: '性別',
            label_race: '種族',
            label_subRace: 'サブ種族',
            label_unitVoice: 'ボイス',
            label_voiceVolume: '声音量',
            label_voicePitch: '声ピッチ',
            label_isMagician: '魔法使い',
            label_goodness: '善悪度',
            label_lawfulness: '秩序度',
            label_exp: '経験値',
            label_potential: '潜在的',
            label_BSstrength: '筋力',
            label_BSendurance: '耐久力',
            label_BSagility: '敏捷',
            label_BSprecision: '感知',
            label_BSintelligence: '知能',
            label_BSwillpower: '意志',
            label_BSPersuade: '説得',
            label_BSBargain: '値段交渉',
            label_BSIntimidate: '威圧',
            label_BSScholarly: '学識',
            label_BSPathfind: '路線を表示(探索)',
            label_BSInsight: '洞察力',
            label_BSMechanics: '機械学',
            label_BSSneak: '隠密',
            label_BSTheft: '窃盗',
            label_BSSmithing: '鍛冶',
            label_BSAlchemy: '錬金術',
            label_BSCooking: '料理',
            label_BSMedical: '医術',
            label_BSTraining: '訓練',
            label_BSTorture: '所長(拷問)',
            label_health: '健康',
            label_morale: '士気',
            label_satiety: '満腹度',
            label_vigor: '活力',
            gender_male: '男性',
            gender_female: '女性',
            isMagician_true: 'はい',
            isMagician_false: 'いいえ',
            race_human: '人間',
            race_elf: 'エルフ',
            race_dwarf: 'ドワーフ',
            race_bruteman: 'ブルートマン',
            trait_placeholder: 'Trait ID',
            trait_delete: '削除',
            unknown_option: '不明',
            // 装備品
            equip_slot_0: "メインハンド",
            equip_slot_1: "サブハンド",
            equip_slot_2: "頭",
            equip_slot_3: "首",
            equip_slot_4: "胸",
            equip_slot_5: "アクセサリー",
            equip_slot_6: "ベルト",
            equip_slot_7: "脚",
            equip_slot_8: "指",
            equip_slot_9: "指",
            equip_not_equipped: "装備なし",
            equip_add_attr: "効果追加",
            equip_attr_type: "Type",
            equip_subSlotIndex: "サブスロット",
            equip_stackNum: "スタック数",
            equip_isNew: "New",
            equip_isStolen: "盗品",
            equip_id: "ID",
            equip_quality: "品質",
            equip_durability: "耐久度",
            equip_add_attrs_title: "付属効果",
            equip_quality_1: "コモン",
            equip_quality_2: "アンコモン",
            equip_quality_3: "レア",
            equip_quality_4: "エピック",
            equip_quality_5: "レジェンダリー",
            equip_level_alter: "LvlAlter",
            // アラートメッセージ
            alert_file_type_error: '対応しているファイルは .dat です。',
            alert_file_read_error: 'ファイルの読み込みに失敗しました。',
            alert_no_npcs_array: 'セーブデータ内に "npcs" 配列が見つかりませんでした。',
            alert_json_parse_error: 'JSONファイルとして解析できませんでした。\n',
            alert_reload_confirm: '現在の変更を破棄してリロードします。よろしいですか？',
            alert_save_error: 'JSONの形式が正しくありません。保存できません。\n',
            alert_preset_save_no_char: 'キャラクターが選択されていません。',
            alert_preset_save_no_uma: '現在のキャラクターに外見データがありません。',
            alert_preset_save_error: 'プリセットの保存中にエラーが発生しました。\n',
        },
        en: {
            // HTML内の静的テキスト
            page_title: "Age of Reforging : TF Character Editor",
            title: "Age of Reforging : TF Character Editor",
            important_notes_title: "Important Notes",
            important_backup_and_disclaimer: "・Always back up your save data before editing. We are not responsible for any save data corruption.",
            important_unknown_effects: "・The effects of changing each item on the game are unknown. It may cause unexpected behavior.",
            important_no_official_contact: "・Do not contact the official developers about any issues caused by save data edited with this tool.",
            important_bug_report: "・<a href=\"https://steamcommunity.com/sharedfiles/filedetails/?id=3578740904\" target=\"_blank\" data-i18n=\"bug_report_link\">Bug reports</a> are welcome <del>until I get bored of AoR</del>",
            bug_report_link: "Bug reports",
            load_instruction: "Please load the following save data.<br><code>C:\\Users\\<b><i>{username}</i></b>\\AppData\\LocalLow\\PersonaeGames\\Age of Reforging The Freelands\\Save\\<b><i>{character_name}</i></b>\\SaveData\\<b><i>{save_name}</i></b>\\sav.dat</code>",
            filter_npc_list_label: "Filter NPC List:",
            filter_npc_list_note: "",
            npc_select_label: "Select NPC to Edit:",
            traits_label: "Traits",
            add_trait_button: "Add Trait",
            equips_label: "Equipment",
            appearance_label: "Appearance (UMA DNA)",
            save_preset_button: "Save Appearance as Preset",
            load_preset_button_label: "Load Appearance from Preset",
            load_preset_button: "Load from Preset",
            uma_unavailable_message: "This character does not have appearance data.",
            json_editor_label: "JSON Data (Not Recommended to Edit):",
            enable_json_edit_button: "Enable Editing",
            save_button: "Save Changes to File",
            reload_button: "Discard Changes and Reload",
            drop_hint: "(You can also open by dragging and dropping sav.dat)",
            select_file_button: "Select File",
            no_file_selected: "No file selected",
            // 動的生成UI
            group_profile: 'Profile',
            group_attributes: 'Attributes',
            group_talents: 'Talents',
            group_status: 'Status',
            label_unitname: 'Name',
            label_gender: 'Gender',
            label_race: 'Race',
            label_subRace: 'Sub-race',
            label_unitVoice: 'Voice',
            label_voiceVolume: 'Volume',
            label_voicePitch: 'Pitch',
            label_isMagician: 'Magician',
            label_goodness: 'Goodness',
            label_lawfulness: 'Lawfulness',
            label_exp: 'Experience',
            label_potential: 'Potential',
            label_BSstrength: 'Strength',
            label_BSendurance: 'Endurance',
            label_BSagility: 'Agility',
            label_BSprecision: 'Precision',
            label_BSintelligence: 'Intelligence',
            label_BSwillpower: 'Willpower',
            label_BSPersuade: 'Persuade',
            label_BSBargain: 'Bargain',
            label_BSIntimidate: 'Intimidate',
            label_BSScholarly: 'Scholarly',
            label_BSPathfind: 'Pathfind',
            label_BSInsight: 'Insight',
            label_BSMechanics: 'Mechanics',
            label_BSSneak: 'Sneak',
            label_BSTheft: 'Theft',
            label_BSSmithing: 'Smithing',
            label_BSAlchemy: 'Alchemy',
            label_BSCooking: 'Cooking',
            label_BSMedical: 'Medical',
            label_BSTraining: 'Training',
            label_BSTorture: 'Torture',
            label_health: 'Health',
            label_morale: 'Morale',
            label_satiety: 'Satiety',
            label_vigor: 'Vigor',
            gender_male: 'Male',
            gender_female: 'Female',
            isMagician_true: 'Yes',
            isMagician_false: 'No',
            race_human: 'Human',
            race_elf: 'Elf',
            race_dwarf: 'Dwarf',
            race_bruteman: 'Bruteman',
            trait_placeholder: 'Trait ID',
            trait_delete: 'Delete',
            unknown_option: 'Unknown',
            // Equipment
            equip_slot_0: "Main Hand",
            equip_slot_1: "Off Hand",
            equip_slot_2: "Head",
            equip_slot_3: "Neck",
            equip_slot_4: "Chest",
            equip_slot_5: "Relic",
            equip_slot_6: "Belt",
            equip_slot_7: "Legs",
            equip_slot_8: "Finger",
            equip_slot_9: "Finger",
            equip_not_equipped: "Not Equipped",
            equip_add_attr: "Add Effect",
            equip_attr_type: "Type",
            equip_subSlotIndex: "Sub Slot",
            equip_stackNum: "Stack",
            equip_isNew: "New",
            equip_isStolen: "Stolen",
            equip_id: "ID",
            equip_quality: "Quality",
            equip_durability: "Durability",
            equip_add_attrs_title: "Additional Attributes",
            equip_quality_1: "Common",
            equip_quality_2: "Uncommon",
            equip_quality_3: "Rare",
            equip_quality_4: "Epic",
            equip_quality_5: "Legendary",
            equip_level_alter: "LvlAlter",
            // アラートメッセージ
            alert_file_type_error: 'Only .dat files are supported.',
            alert_file_read_error: 'Failed to read the file.',
            alert_no_npcs_array: 'Could not find "npcs" array in the save data.',
            alert_json_parse_error: 'Could not parse as a JSON file.\n',
            alert_reload_confirm: 'Discard current changes and reload?',
            alert_save_error: 'Invalid JSON format. Cannot save.\n',
            alert_preset_save_no_char: 'No character selected.',
            alert_preset_save_no_uma: 'The current character has no appearance data.',
            alert_preset_save_error: 'An error occurred while saving the preset.\n',
        }
    };

    // ★★★ 編集対象の項目をグループ化して定義 ★★★
    const editableGroups = [
        {
            titleKey: 'group_profile',
            fields: [
                { key: 'unitname', labelKey: 'label_unitname', type: 'text', readonly: true, inputWidth: '120px' },
                { 
                    key: 'gender', labelKey: 'label_gender', type: 'select', 
                    options: [{ value: 1, textKey: 'gender_male' }, { value: 2, textKey: 'gender_female' }] 
                },
                { 
                    key: 'race', labelKey: 'label_race', type: 'select',
                    options: [
                        { value: 1, textKey: 'race_human' }, { value: 2, textKey: 'race_elf' },
                        { value: 3, textKey: 'race_dwarf' }, { value: 4, textKey: 'race_bruteman' }
                    ]
                },
                { key: 'subRace', labelKey: 'label_subRace', type: 'number' },
                { key: 'unitVoice', labelKey: 'label_unitVoice', type: 'number' },
                { key: 'voiceVolume', labelKey: 'label_voiceVolume', type: 'number', step: 0.1 },
                { key: 'voicePitch', labelKey: 'label_voicePitch', type: 'number', step: 0.01 },
                { key: 'exp', labelKey: 'label_exp', type: 'number' },
                { key: 'isMagician', labelKey: 'label_isMagician', type: 'checkbox' },
                { key: 'goodness', labelKey: 'label_goodness', type: 'number', min: -100, max: 100 },
                { key: 'lawfulness', labelKey: 'label_lawfulness', type: 'number', min: -100, max: 100 },
            ]
        },
        {
            titleKey: 'group_attributes',
            fields: [
                { key: 'potential', labelKey: 'label_potential', type: 'number', path: ['humanAttribute'] },
                { key: 'BSstrength', labelKey: 'label_BSstrength', type: 'number', path: ['humanAttribute'], min: 0, max: 99 },
                { key: 'BSendurance', labelKey: 'label_BSendurance', type: 'number', path: ['humanAttribute'], min: 0, max: 99 },
                { key: 'BSagility', labelKey: 'label_BSagility', type: 'number', path: ['humanAttribute'], min: 0, max: 99 },
                { key: 'BSprecision', labelKey: 'label_BSprecision', type: 'number', path: ['humanAttribute'], min: 0, max: 99 },
                { key: 'BSintelligence', labelKey: 'label_BSintelligence', type: 'number', path: ['humanAttribute'], min: 0, max: 99 },
                { key: 'BSwillpower', labelKey: 'label_BSwillpower', type: 'number', path: ['humanAttribute'], min: 0, max: 99 },
            ]
        },
        {
            titleKey: 'group_talents',
            fields: [
                { key: 'BSPersuade', labelKey: 'label_BSPersuade', type: 'number', path: ['humanTalent'], min: 0, max: 99 },
                { key: 'BSBargain', labelKey: 'label_BSBargain', type: 'number', path: ['humanTalent'], min: 0, max: 99 },
                { key: 'BSIntimidate', labelKey: 'label_BSIntimidate', type: 'number', path: ['humanTalent'], min: 0, max: 99 },
                { key: 'BSScholarly', labelKey: 'label_BSScholarly', type: 'number', path: ['humanTalent'], min: 0, max: 99 },
                { key: 'BSPathfind', labelKey: 'label_BSPathfind', type: 'number', path: ['humanTalent'], min: 0, max: 99 },
                { key: 'BSInsight', labelKey: 'label_BSInsight', type: 'number', path: ['humanTalent'], min: 0, max: 99 },
                { key: 'BSMechanics', labelKey: 'label_BSMechanics', type: 'number', path: ['humanTalent'], min: 0, max: 99 },
                { key: 'BSSneak', labelKey: 'label_BSSneak', type: 'number', path: ['humanTalent'], min: 0, max: 99 },
                { key: 'BSTheft', labelKey: 'label_BSTheft', type: 'number', path: ['humanTalent'], min: 0, max: 99 },
                { key: 'BSSmithing', labelKey: 'label_BSSmithing', type: 'number', path: ['humanTalent'], min: 0, max: 99 },
                { key: 'BSAlchemy', labelKey: 'label_BSAlchemy', type: 'number', path: ['humanTalent'], min: 0, max: 99 },
                { key: 'BSCooking', labelKey: 'label_BSCooking', type: 'number', path: ['humanTalent'], min: 0, max: 99 },
                { key: 'BSMedical', labelKey: 'label_BSMedical', type: 'number', path: ['humanTalent'], min: 0, max: 99 },
                { key: 'BSTraining', labelKey: 'label_BSTraining', type: 'number', path: ['humanTalent'], min: 0, max: 99 },
                { key: 'BSTorture', labelKey: 'label_BSTorture', type: 'number', path: ['humanTalent'], min: 0, max: 99 },
            ]
        },
        {
            titleKey: 'group_status',
            fields: [
                { key: 'health', labelKey: 'label_health', type: 'number', min: 0, max: 100 },
                { key: 'morale', labelKey: 'label_morale', type: 'number', min: 0, max: 100 },
                { key: 'satiety', labelKey: 'label_satiety', type: 'number', min: 0, max: 100 },
                { key: 'vigor', labelKey: 'label_vigor', type: 'number', min: 0, max: 100 },
            ]
        }
    ];

    // ===== 最初に個別フォームを生成 =====
    function createIndividualForm() {
        individualForm.innerHTML = '';
        editableGroups.forEach(group => {
            const groupContainer = document.createElement('div');
            groupContainer.className = 'form-group';

            const groupTitle = document.createElement('div');
            groupTitle.className = 'form-group-title';
            groupTitle.textContent = i18n[currentLang][group.titleKey] || group.titleKey;
            groupContainer.appendChild(groupTitle);

            const gridContainer = document.createElement('div');
            gridContainer.className = 'form-group-grid';

            group.fields.forEach(field => {
                const div = document.createElement('div');
                const label = document.createElement('label');
                label.htmlFor = `input-${field.key}`;
                label.textContent = i18n[currentLang][field.labelKey] || field.labelKey;
                
                let inputElement;

                if (field.type === 'select') {
                    inputElement = document.createElement('select');
                    inputElement.id = `input-${field.key}`;
                    if (field.options) {
                        field.options.forEach(opt => {
                            const option = document.createElement('option');
                            option.value = opt.value;
                            option.textContent = i18n[currentLang][opt.textKey] || opt.textKey;
                            inputElement.appendChild(option);
                        });
                    }
                } else if (field.type === 'checkbox') {
                    inputElement = document.createElement('input');
                    inputElement.type = 'checkbox';
                    inputElement.id = `input-${field.key}`;
                    // チェックボックスは幅を固定しない
                    inputElement.style.width = 'auto';
                    inputElement.classList.add('large-checkbox'); // サイズ変更用のクラスを追加
                } else { // 'text', 'number'
                    inputElement = document.createElement('input');
                    inputElement.type = field.type;
                    inputElement.id = `input-${field.key}`;
                    if (field.step) inputElement.step = field.step;
                    if (field.readonly) {
                        inputElement.readOnly = true;
                        inputElement.style.backgroundColor = '#e9ecef';
                    }
                if (field.min !== undefined) inputElement.min = field.min;
                if (field.max !== undefined) inputElement.max = field.max;
                }
                // 個別の幅が指定されていれば適用
                if (field.inputWidth) {
                    inputElement.style.width = field.inputWidth;
                }      
                if (!field.readonly) {
                    inputElement.addEventListener('input', updateJsonEditorFromInputs);
                    // 値の範囲をチェックし、範囲外なら補正するリスナーを追加
                    if (field.min !== undefined || field.max !== undefined) {
                        inputElement.addEventListener('change', (e) => {
                            const value = parseFloat(e.target.value);
                            if (field.max !== undefined && value > field.max) {
                                e.target.value = field.max;
                            } else if (field.min !== undefined && value < field.min) {
                                e.target.value = field.min;
                            }
                        });
                    }
                }

                div.appendChild(label);
                div.appendChild(inputElement);
                gridContainer.appendChild(div);
            });
            groupContainer.appendChild(gridContainer);
            individualForm.appendChild(groupContainer);
        });
    }

    // フォーム全体の入力欄の有効/無効を切り替える関数
    function setFormEnabled(enabled) {
        const formElements = individualForm.querySelectorAll('input, select');
        formElements.forEach(el => el.disabled = !enabled);

        const traitElements = traitsList.querySelectorAll('input, button');
        traitElements.forEach(el => el.disabled = !enabled);
        addTraitButton.disabled = !enabled;
        
        // equipsListは動的に再生成されるため、都度取得する
        const equipsContainer = document.getElementById('equips-editor-container');
        if (!equipsContainer) return;

        // detailsタグの状態（開いているか閉じているか）を考慮する
        const details = equipsContainer.querySelector('details');
        if (details) {
            const summary = details.querySelector('summary');
            if (summary) summary.style.pointerEvents = enabled ? 'auto' : 'none';
        }

        const currentEquipsList = equipsContainer.querySelector('#equips-list');

        const equipElements = currentEquipsList.querySelectorAll('input, select, button');
        equipElements.forEach(el => el.disabled = !enabled);


        // UMAセクションのボタンと、動的に生成されるフォーム内の要素を制御
        savePresetButton.disabled = !enabled;
        loadPresetInput.disabled = !enabled;
        loadPresetInput.parentElement.classList.toggle('disabled', !enabled);
        const umaFormElements = umaEditorForm.querySelectorAll('input, button');
        umaFormElements.forEach(el => el.disabled = !enabled);
    }

    // ===== Trait名を取得するヘルパー関数 =====
    function getTraitName(traitId, lang) {
        if (traitData && traitData[traitId]) {
            // 指定言語の名称があればそれを、なければ英語、それもなければ不明を返す
            return traitData[traitId][lang] || traitData[traitId]['en'] || i18n[currentLang].unknown_option;
        }
        return i18n[currentLang].unknown_option;
    }


    // ===== 言語切り替え関連 =====
    function setLanguage(lang) {
        currentLang = i18n[lang] ? lang : 'en'; // 対応言語がなければ英語にフォールバック
        document.title = i18n[currentLang].page_title; // ページのタイトルを更新

        // 静的テキストの更新
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');

            // 子要素を持つラベルは、テキストノードだけを更新する
            if (key === 'filter_npc_list_label') {
                el.childNodes[0].nodeValue = i18n[currentLang][key];
                return; // この要素の処理は完了
            }
            // load_preset_button_label は子要素を持つため、中身を直接書き換えない
            if (key === 'load_preset_button_label') {
                return;
            }
            
            if (i18n[currentLang].hasOwnProperty(key)) {
                // HTMLタグを含むキーはinnerHTML、それ以外はtextContentで更新
                if (key === 'important_bug_report' || key === 'load_instruction') {
                    el.innerHTML = i18n[currentLang][key];
                } else {
                    el.textContent = i18n[currentLang][key];
                }

            }
        });
        document.querySelector('label[for="npcSelector"]').textContent = i18n[currentLang].npc_select_label;
        document.getElementById('npcSearch').placeholder = i18n[currentLang].label_unitname;

        // 動的に生成されたフォームのテキストのみを更新
        updateDynamicFormLanguage();

        // Traitのデータリストを更新
        updateTraitDatalist();
    }

    // フォームの値を維持したまま、ラベル等の言語のみを更新する関数
    function updateDynamicFormLanguage() {
        // グループタイトルの更新
        document.querySelectorAll('.form-group-title').forEach((titleEl, index) => {
            const group = editableGroups[index];
            if (group) {
                titleEl.textContent = i18n[currentLang][group.titleKey] || group.titleKey;
            }
        });

        // 各入力欄のラベルとオプションを更新
        editableGroups.forEach(group => {
            group.fields.forEach(field => {
                const label = document.querySelector(`label[for="input-${field.key}"]`);
                if (label) {
                    label.textContent = i18n[currentLang][field.labelKey] || field.labelKey;
                }
                if (field.type === 'select' && field.options) {
                    const select = document.getElementById(`input-${field.key}`);
                    if (select) {
                        field.options.forEach((opt, optIndex) => {
                            if (select.options[optIndex]) {
                                select.options[optIndex].textContent = i18n[currentLang][opt.textKey] || opt.textKey;
                            }
                        });
                    }
                }
            });
        });

        // Traitsセクションの更新
        const traitInputs = traitsList.querySelectorAll('input[type="number"]');
        traitInputs.forEach(input => {
            const nameLabel = input.nextElementSibling;
            const removeBtn = nameLabel.nextElementSibling;
            if (nameLabel) {
                if (input.value) {
                    nameLabel.textContent = getTraitName(input.value, currentLang);
                } else {
                    nameLabel.textContent = '';
                }
            }
            if (removeBtn) removeBtn.textContent = i18n[currentLang].trait_delete;
        });

        // 装備品セクションの更新
        const equipsContainer = document.getElementById('equips-editor-container');
        if (equipsContainer) {
            // セクションタイトル
            const sectionLabel = equipsContainer.querySelector('.section-label');
            if (sectionLabel) sectionLabel.textContent = i18n[currentLang].equips_label;

            // 各スロット
            equipsContainer.querySelectorAll('.equip-item').forEach((item, index) => {
                const header = item.querySelector('.equip-slot-header');
                if (header) {
                    header.querySelector('.equip-slot-name').textContent = i18n[currentLang][`equip_slot_${index}`] || `Slot ${index}`;
                    const idDisplay = header.querySelector('.equip-id-display');
                    if (idDisplay && idDisplay.textContent !== '') {
                        idDisplay.textContent = i18n[currentLang].equip_not_equipped;
                    }
                }
                // 詳細項目ラベル
                item.querySelectorAll('.equip-field-item').forEach(fieldItem => {
                    const input = fieldItem.querySelector('[data-key]');
                    const label = fieldItem.querySelector('label');
                    if (input && label) {
                        const key = input.dataset.key;
                        const labelKey = `equip_${key}`;
                        if (label) label.textContent = i18n[currentLang][labelKey] || key.charAt(0).toUpperCase() + key.slice(1);

                        if (key === 'quality' && input.tagName === 'SELECT') {
                            Array.from(input.options).forEach(opt => {
                                const qualityKey = `equip_quality_${opt.value}`;
                                if (i18n[currentLang][qualityKey]) {
                                    opt.textContent = i18n[currentLang][qualityKey];
                                } else if (!opt.dataset.unknown) { // 不明オプションは書き換えない
                                    opt.textContent = `${i18n[currentLang].unknown_option} (${opt.value})`;
                                }
                            });
                        }
                    }
                });
                // 付属効果のタイトルやボタンも更新
                if (item.querySelector('.add-attrs-container h4')) item.querySelector('.add-attrs-container h4').textContent = i18n[currentLang].equip_add_attrs_title;
                if (item.querySelector('.btn-add-attr')) item.querySelector('.btn-add-attr').textContent = i18n[currentLang].equip_add_attr;

                // 付属効果の各行のラベルと削除ボタンを更新
                item.querySelectorAll('.add-attr-item').forEach(attrItem => {
                    const typeLabel = attrItem.querySelector('label:nth-of-type(1)');
                    if (typeLabel) typeLabel.textContent = i18n[currentLang].equip_attr_type;
                    
                    const levelAlterLabel = attrItem.querySelector('label:nth-of-type(3)'); // "Value"は固定なので3番目のラベル
                    if (levelAlterLabel) levelAlterLabel.textContent = i18n[currentLang].equip_level_alter;

                    const deleteBtn = attrItem.querySelector('.btn-delete');
                    if (deleteBtn) deleteBtn.textContent = i18n[currentLang].trait_delete;
                });
            });
        }
    }

    // Traitのデータリストを更新する関数
    function updateTraitDatalist() {
        if (!traitDatalist) return;

        traitDatalist.innerHTML = ''; // 中身をクリア        
        if (!traitData) return;

        Object.keys(traitData).forEach(traitId => {
            const traitName = getTraitName(traitId, currentLang);
            const option = document.createElement('option');
            option.value = traitId;
            option.textContent = `${traitId} : ${traitName}`;
            traitDatalist.appendChild(option);
        });
    }
    langJaButton.addEventListener('click', () => setLanguage('ja'));
    langEnButton.addEventListener('click', () => setLanguage('en'));
    
    // ===== アプリケーション初期化処理 =====
    async function initializeApp() {
        try {
            const response = await fetch('traits.json');
            traitData = await response.json();
        } catch (error) {
            console.error('Failed to load traits.json:', error);
            alert('Trait定義ファイル(traits.json)の読み込みに失敗しました。');
        }
        // 初期言語を設定 (ブラウザの言語が日本語なら日本語、それ以外は英語)
        setLanguage(navigator.language.startsWith('ja') ? 'ja' : 'en');
    }
    
    // 最初にフォームの骨格を生成
    createIndividualForm();
    // 初期状態ではフォームを無効化しておく
    setFormEnabled(false);

    // Trait用のdatalistを生成してbodyに追加
    traitDatalist = document.createElement('datalist');
    traitDatalist.id = 'traitDatalist';
    document.body.appendChild(traitDatalist);
    // 非同期で初期化処理を実行
    initializeApp();

    // ===== ファイル選択時の処理 =====
    // ファイル選択ダイアログが開くたびにinputの値をリセットする
    // これにより、同じファイルを連続で選択してもchangeイベントが発火するようになる
    fileInput.addEventListener('click', (event) => {
        event.target.value = null;
    });

    fileInput.addEventListener('change', (event) => handleFile(event.target.files[0]));

    // ===== ドラッグ＆ドロップ処理 =====
    window.addEventListener('dragover', (event) => {
        event.preventDefault(); // デフォルトの挙動（ファイルを開くなど）を防ぐ
        dragOverlay.classList.remove('hidden');
    });

    window.addEventListener('dragleave', (event) => {
        event.preventDefault();
        // event.relatedTargetがnullの場合、ウィンドウの外に出たと判断できる
        if (!event.relatedTarget) {
           dragOverlay.classList.add('hidden');
        }
    });

    // ドラッグ操作がキャンセルされた場合など、終了時にも確実に非表示にする
    window.addEventListener('dragend', (event) => {
        event.preventDefault();
        dragOverlay.classList.add('hidden');
    });

    window.addEventListener('drop', (event) => {
        event.preventDefault(); // デフォルトの挙動を防ぐ
        dragOverlay.classList.add('hidden');

        if (event.dataTransfer.files.length > 0) {
            handleFile(event.dataTransfer.files[0]);
        }
    });

    // ===== ファイル処理の共通関数 =====
    function handleFile(file) {
        if (!file) return;
        loadedFileObject = file; // 読み込んだFileオブジェクトを保持
        fileNameDisplay.textContent = file.name; // ファイル名を表示

        // 拡張子チェック
        if (!file.name.endsWith('.dat')) {
            alert(i18n[currentLang].alert_file_type_error);
            return;
        }

        // 読み込み前に、現在選択中のNPCの情報を保持しておく
        const currentNpcInfo = (fullSaveData && currentNpcIndex !== null) ? {
            unitId: fullSaveData.npcs[currentNpcIndex].unitId,
            unitname: fullSaveData.npcs[currentNpcIndex].unitname
        } : null;

        originalFileName = file.name;
        const reader = new FileReader();

        reader.onload = (e) => {
            // 読み込み成功時に初めてデータをリセット
            currentNpcIndex = null;
            fullSaveData = null;
            // 保持したNPC情報をヒントとして渡す
            loadAndDisplayData(e.target.result, currentNpcInfo);
        };
        reader.onerror = () => alert(i18n[currentLang].alert_file_read_error);
        reader.readAsText(file);
    }

    // ===== NPC選択プルダウンの生成処理 =====
    function populateNpcSelector(npcs, selectedIndex = 0) {
        npcSelector.innerHTML = '';
        npcs.forEach((npc, index) => {
            const option = document.createElement('option');
            option.textContent = `${npc.unitname || '名称未設定'} (Lv. ${npc.level || '?'})`;
            option.value = index;
            npcSelector.appendChild(option);
        });
        // 指定されたインデックス、または範囲外なら0番目を選択
        const newIndex = npcSelector.options[selectedIndex] ? selectedIndex : 0;
        npcSelector.value = newIndex;
        displayNpcData(newIndex);
    }

    // ===== 選択されたNPCのデータを両方のエディタに表示する処理 =====
    function displayNpcData(index) {
        if (fullSaveData && fullSaveData.npcs[index]) {
            // JSONエディタを読み取り専用に戻す
            jsonEditor.readOnly = true;
            enableJsonEdit.style.display = 'inline-block';

            const selectedNpc = fullSaveData.npcs[index];
            currentNpcIndex = index; // 現在のインデックスを更新
            currentNpcOriginalData = JSON.parse(JSON.stringify(selectedNpc)); // 元のデータをディープコピーして保持
            
            // 元のUMA DNAデータも解析して保持しておく
            currentNpcOriginalUmaDna = null;
            if (currentNpcOriginalData.umaRecipe) {
                try {
                    const umaRecipe = JSON.parse(currentNpcOriginalData.umaRecipe);
                    if (umaRecipe.dna && umaRecipe.dna[0] && umaRecipe.dna[0].packedDna) {
                        currentNpcOriginalUmaDna = JSON.parse(umaRecipe.dna[0].packedDna);
                    }
                } catch (e) { /* パース失敗時はnullのまま */ }
            }

            isUpdatingFromJson = true; // 更新中フラグを立てる
            jsonEditor.value = JSON.stringify(selectedNpc, null, 2);
            updateIndividualInputs(selectedNpc);
            updateTraitsInputs(selectedNpc); // Traitsフォームを更新
            updateUmaInputs(selectedNpc); // UMAフォームも更新
            updateEquipsInputs(selectedNpc); // 装備品フォームを更新
            isUpdatingFromJson = false; // フラグを下ろす
        }
    }

    // ===== NPCの選択が変更されたときの処理 =====
    function onNpcSelectionChange(newIndex) {
        // 1. 前のNPCのデータを保存する
        if (fullSaveData && currentNpcIndex !== null) {
            try {
                fullSaveData.npcs[currentNpcIndex] = JSON.parse(jsonEditor.value);
            } catch (e) {
                console.error("Failed to save previous NPC data on switch:", e);
            }
        }
        // 2. 新しいNPCのデータを表示する
        displayNpcData(newIndex);
    }

    // ===== JSONオブジェクトから個別UIに値をセットする関数 =====
    function updateIndividualInputs(npcData) {
        editableGroups.forEach(group => {
            group.fields.forEach(field => {
                const inputElement = document.getElementById(`input-${field.key}`);
                if (!inputElement) return;

                let valueSource = npcData;
                // pathが指定されていれば、その階層を掘り進む
                if (field.path) {
                    valueSource = field.path.reduce((obj, key) => (obj || {})[key], npcData);
                }

                const value = valueSource ? valueSource[field.key] : '';

                if (field.type === 'select') {
                    // 既存の選択肢に値があるか確認
                    const optionExists = Array.from(inputElement.options).some(opt => opt.value == value);
                    // 既存の選択肢にない場合、新しい選択肢を動的に追加
                    if (!optionExists && value !== null && value !== '') {
                        const newOption = document.createElement('option');
                        newOption.value = value;
                    newOption.textContent = `${i18n[currentLang].unknown_option} (${value})`;
                        inputElement.appendChild(newOption);
                    }
                }

                if (field.type === 'checkbox') {
                    inputElement.checked = (value === true); // trueの場合のみチェック
                }
                else {
                    inputElement.value = (value !== null && value !== undefined) ? value : '';
                    if (value === '' || value === null) {
                        inputElement.classList.add('input-null-warning');
                    } else {
                        inputElement.classList.remove('input-null-warning');
                    }
                }
            });
        });
    }

    // ===== Traitsから個別UIに値をセットする関数 =====
    function updateTraitsInputs(npcData) {
        traitsList.innerHTML = '';
        if (npcData.traits && Array.isArray(npcData.traits)) {
            npcData.traits.forEach((trait) => {
                createTraitInput(trait);
            });
        }
    }

    // ===== Trait入力欄を1つ生成する関数 =====
    function createTraitInput(value = '') {
        const div = document.createElement('div');
        div.className = 'trait-item';

        const input = document.createElement('input');
        input.type = 'number';
        input.value = value;
        input.min = 0;
        input.max = 999;
        input.placeholder = i18n[currentLang].trait_placeholder;
        input.setAttribute('list', 'traitDatalist'); // 常にdatalistを参照
        if (input.value === '') {
            input.classList.add('input-null-warning');
        } else {
            input.classList.remove('input-null-warning');
        }

        const nameLabel = document.createElement('span');
        nameLabel.className = 'trait-name';

        const updateNameLabel = (id) => {
            if (id) {
                nameLabel.textContent = getTraitName(id, currentLang);
            } else {
                nameLabel.textContent = '';
            }
        };

        input.addEventListener('input', () => {
            // 3桁を超える入力を防ぐ
            if (input.value.length > 3) {
                input.value = input.value.slice(0, 3);
            }
            updateNameLabel(input.value);
            updateJsonEditorFromInputs();
        });

        const removeBtn = document.createElement('button');
        removeBtn.textContent = i18n[currentLang].trait_delete;
        removeBtn.type = 'button';
        removeBtn.className = 'btn-delete'; // 専用スタイルを適用
        removeBtn.onclick = () => {
            div.remove();
            updateJsonEditorFromInputs(); // 削除をJSONに反映
        };

        div.appendChild(input);
        div.appendChild(nameLabel);
        div.appendChild(removeBtn);
        traitsList.appendChild(div);

        // 初期表示
        updateNameLabel(value);
    }

    // ===== 装備品UIを生成/更新する関数 =====
    function updateEquipsInputs(npcData) {
        equipsEditorContainer.innerHTML = ''; // コンテナの中身を一度にクリア

        const details = document.createElement('details');
        const summary = document.createElement('summary');
        summary.innerHTML = `<span class="section-label" data-i18n="equips_label">${i18n[currentLang].equips_label}</span>`;
        details.appendChild(summary);

        const listContainer = document.createElement('div');
        listContainer.id = 'equips-list';
        details.appendChild(listContainer);
        equipsEditorContainer.appendChild(details);

        const equips = npcData.equips || [];

        for (let i = 0; i < 10; i++) {
            const equip = equips[i];
            const slotContainer = document.createElement('div');
            slotContainer.className = 'equip-item';

            const header = document.createElement('div');
            header.className = 'equip-slot-header';
            const slotName = i18n[currentLang][`equip_slot_${i}`] || `Slot ${i}`;
            header.innerHTML = `<span class="equip-slot-name">${slotName}</span> <span class="equip-id-display">${equip ? '' : i18n[currentLang].equip_not_equipped}</span>`;
            slotContainer.appendChild(header);

            if (equip) {
                const fieldsContainer = document.createElement('div');
                fieldsContainer.className = 'equip-fields';

                // ID, Quality, Durability
                ['id', 'subSlotIndex', 'stackNum', 'isStolen', 'quality', 'durability', 'isNew'].forEach(key => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'equip-field-item';
                    const label = document.createElement('label');
                    const labelKey = `equip_${key}`;
                    label.textContent = i18n[currentLang][labelKey] || key.charAt(0).toUpperCase() + key.slice(1);
                    
                    let input;
                    if (key === 'isNew') {
                        input = document.createElement('input');
                        input.type = 'checkbox';
                        input.checked = equip[key];
                        input.style.width = 'auto';
                        input.classList.add('large-checkbox');
                    } else if (key === 'quality') {
                        input = document.createElement('select');
                        for (let i = 1; i <= 5; i++) {
                            const option = document.createElement('option');
                            option.value = i;
                            option.textContent = i18n[currentLang][`equip_quality_${i}`];
                            input.appendChild(option);
                        }
                        // 現在の値が1-5の範囲外なら「不明」オプションを追加
                        const currentValue = equip[key];
                        if (currentValue !== null && currentValue !== undefined && (currentValue < 1 || currentValue > 5)) {
                            const unknownOption = document.createElement('option');
                            unknownOption.value = currentValue;
                            unknownOption.textContent = `${i18n[currentLang].unknown_option} (${currentValue})`;
                            unknownOption.dataset.unknown = "true";
                            input.appendChild(unknownOption);
                        }
                        input.value = currentValue;
                    } else {
                        input = document.createElement('input');
                        input.type = 'number';
                        if (key === 'durability') input.step = 'any';
                        input.value = equip[key] ?? null;
                    }

                    input.dataset.key = key;
                    input.addEventListener('input', updateJsonEditorFromInputs);
                    itemDiv.appendChild(label);
                    itemDiv.appendChild(input);
                    fieldsContainer.appendChild(itemDiv);
                });

                // AddAttrs
                const addAttrsContainer = document.createElement('div');
                addAttrsContainer.className = 'add-attrs-container';
                const addAttrsTitle = document.createElement('h4');
                addAttrsTitle.textContent = i18n[currentLang].equip_add_attrs_title;
                addAttrsContainer.appendChild(addAttrsTitle);

                const addAttrsList = document.createElement('div');
                addAttrsList.className = 'add-attrs-list';
                addAttrsContainer.appendChild(addAttrsList);

                (equip.addAttrs || []).forEach((attr, attrIndex) => {
                    createAddAttrInput(addAttrsList, attr, i, attrIndex);
                });

                const addAttrButton = document.createElement('button');
                addAttrButton.textContent = i18n[currentLang].equip_add_attr;
                addAttrButton.type = 'button';
                addAttrButton.className = 'btn-add-attr';
                addAttrButton.onclick = () => {
                    if ((equip.addAttrs || []).length < 10) {
                        const newAttr = { type: 0, value: 0, levelAlter: 0 };
                        if (!equip.addAttrs) equip.addAttrs = [];
                        equip.addAttrs.push(newAttr);
                        createAddAttrInput(addAttrsList, newAttr, i, equip.addAttrs.length - 1);
                        updateJsonEditorFromInputs();
                    }
                };
                addAttrsContainer.appendChild(addAttrButton);

                fieldsContainer.appendChild(addAttrsContainer);
                slotContainer.appendChild(fieldsContainer);
            }

            listContainer.appendChild(slotContainer);
        }
    }

    function createAddAttrInput(parent, attr, slotIndex, attrIndex) {
        const item = document.createElement('div');
        item.className = 'add-attr-item';

        // Type
        const typeLabel = document.createElement('label');
        typeLabel.textContent = i18n[currentLang].equip_attr_type;
        const typeInput = document.createElement('input');
        typeInput.type = 'number';
        typeInput.value = attr.type;
        typeInput.dataset.key = 'type';
        typeInput.addEventListener('input', updateJsonEditorFromInputs);

        // Value
        const valueLabel = document.createElement('label');
        valueLabel.textContent = 'Value';
        const valueInput = document.createElement('input');
        valueInput.type = 'number';
        valueInput.step = 'any'; // 小数点を許可
        valueInput.value = attr.value;
        valueInput.dataset.key = 'value';
        valueInput.addEventListener('input', updateJsonEditorFromInputs);

        // LevelAlter
        const levelAlterLabel = document.createElement('label');
        levelAlterLabel.textContent = i18n[currentLang].equip_level_alter;
        const levelAlterInput = document.createElement('input');
        levelAlterInput.type = 'number';
        levelAlterInput.value = attr.levelAlter;
        levelAlterInput.dataset.key = 'levelAlter';
        levelAlterInput.addEventListener('input', updateJsonEditorFromInputs);


        const removeBtn = document.createElement('button');
        removeBtn.textContent = i18n[currentLang].trait_delete;
        removeBtn.type = 'button';
        removeBtn.className = 'btn-delete';
        removeBtn.onclick = () => {
            item.remove();
            // 削除操作も即座にJSONに反映
            // 装備品セクションが開いている前提でupdateJsonEditorFromInputsを呼ぶ
            updateJsonEditorFromInputs(); 
        };

        item.append(typeLabel, typeInput, valueLabel, valueInput, levelAlterLabel, levelAlterInput, removeBtn);
        parent.appendChild(item);
    }

    // ===== UMAレシピから個別UIに値をセットする関数 =====
    function updateUmaInputs(npcData) {
        umaEditorForm.innerHTML = ''; // フォームをクリア
        umaUnavailableMessage.classList.add('hidden'); // メッセージを一旦隠す
 
        // 外見データの有無をチェック
        const hasUmaRecipe = npcData && npcData.umaRecipe;

        // プリセット関連ボタンの有効/無効を切り替え
        savePresetButton.disabled = !hasUmaRecipe;
        loadPresetInput.disabled = !hasUmaRecipe;
        loadPresetInput.parentElement.classList.toggle('disabled', !hasUmaRecipe);

        if (!hasUmaRecipe) {
            umaUnavailableMessage.classList.remove('hidden');
            return;
        }

        try {
            const umaRecipe = JSON.parse(npcData.umaRecipe);
            if (!umaRecipe.dna || !umaRecipe.dna[0] || !umaRecipe.dna[0].packedDna) return;

            const packedDna = JSON.parse(umaRecipe.dna[0].packedDna);
            const dnaSettings = packedDna.bDnaSettings;

            if (!Array.isArray(dnaSettings)) return;

            // --- DNAセクション ---
            const dnaDetails = document.createElement('details');
            const dnaSummary = document.createElement('summary');
            dnaSummary.innerHTML = '<h3>DNA</h3>';
            dnaDetails.appendChild(dnaSummary);

            // DNA設定に基づいて動的にフォームを生成
            dnaSettings.forEach(dnaItem => {
                const div = document.createElement('div');
                const label = document.createElement('label');
                // 項目名をそのままラベルとして使用
                label.htmlFor = `uma-input-${dnaItem.name}`;
                label.textContent = dnaItem.name;

                const input = document.createElement('input');
                input.type = 'number';
                input.id = `uma-input-${dnaItem.name}`;
                input.value = dnaItem.value;
                if (input.value === '' || input.value === null) {
                    input.classList.add('input-null-warning');
                } else {
                    input.classList.remove('input-null-warning');
                }
                input.addEventListener('input', updateUmaRecipeFromInputs);

                div.appendChild(label);
                div.appendChild(input);
                dnaDetails.appendChild(div);
            });
            umaEditorForm.appendChild(dnaDetails);

            // wardrobeSetに基づいて動的にフォームを生成
            const wardrobeSet = umaRecipe.wardrobeSet;
            if (Array.isArray(wardrobeSet)) {
                // --- Wardrobeセクション ---
                const wardrobeDetails = document.createElement('details');
                const wardrobeSummary = document.createElement('summary');
                wardrobeSummary.innerHTML = '<h3>Wardrobe</h3>';
                wardrobeDetails.appendChild(wardrobeSummary);

                wardrobeSet.forEach(item => {
                    const div = document.createElement('div');
                    const label = document.createElement('label');
                    label.htmlFor = `uma-wardrobe-input-${item.slot}`;
                    label.textContent = item.slot; // スロット名をラベルとして使用

                    const input = document.createElement('input');
                    input.type = 'text'; // レシピ名はテキスト
                    input.id = `uma-wardrobe-input-${item.slot}`;
                    input.value = item.recipe;
                    if (input.value === '' || input.value === null) {
                        input.classList.add('input-null-warning');
                    } else {
                        input.classList.remove('input-null-warning');
                    }
                    input.addEventListener('input', updateUmaRecipeFromInputs);

                    div.appendChild(label);
                    div.appendChild(input);
                    wardrobeDetails.appendChild(div);
                });
                umaEditorForm.appendChild(wardrobeDetails);
            }

            // characterColorsに基づいて動的にフォームを生成
            const characterColors = umaRecipe.characterColors;
            if (Array.isArray(characterColors)) {
                // --- Colorsセクション ---
                const colorsDetails = document.createElement('details');
                const colorsSummary = document.createElement('summary');
                colorsSummary.innerHTML = '<h3>Colors</h3>';
                colorsDetails.appendChild(colorsSummary);

                characterColors.forEach(item => {
                    const div = document.createElement('div');
                    const label = document.createElement('label');
                    label.htmlFor = `uma-color-input-${item.name}`;
                    label.textContent = item.name; // "Hair", "Skin"など

                    const input = document.createElement('input');
                    input.type = 'color';
                    input.id = `uma-color-input-${item.name}`;
                    
                    // 先頭3つのRGB値のみを使い、16進数カラーコードに変換
                    if (item.colors && item.colors.length >= 3) {
                        const r = item.colors[0].toString(16).padStart(2, '0');
                        const g = item.colors[1].toString(16).padStart(2, '0');
                        const b = item.colors[2].toString(16).padStart(2, '0');
                        input.value = `#${r}${g}${b}`;
                    }

                    input.addEventListener('input', updateUmaRecipeFromInputs);

                    div.appendChild(label);
                    div.appendChild(input);
                    colorsDetails.appendChild(div);
                });
                umaEditorForm.appendChild(colorsDetails);
            }
        } catch (e) {
            console.error("Error updating UMA recipe:", e);
        }
    }

    // ===== イベントリスナーの設定 =====
    npcSelector.addEventListener('change', (e) => {
        onNpcSelectionChange(e.target.value);
    });

    // JSON編集有効化ボタンのイベントリスナー
    enableJsonEdit.addEventListener('click', () => {
        jsonEditor.readOnly = false;
        jsonEditor.focus();
        enableJsonEdit.style.display = 'none'; // 一度有効にしたらボタンを隠す
    });

    function loadAndDisplayData(jsonString, selectionHint = null) {
        try {
            fullSaveData = JSON.parse(jsonString);
            if (fullSaveData && Array.isArray(fullSaveData.npcs)) {
                let targetIndex = 0;
                // selectionHintがオブジェクト（unitIdとunitnameを持つ）の場合
                if (selectionHint && typeof selectionHint === 'object' && selectionHint.unitId && selectionHint.unitname) {
                    const foundIndex = fullSaveData.npcs.findIndex(npc => 
                        npc.unitId === selectionHint.unitId && npc.unitname === selectionHint.unitname
                    );
                    if (foundIndex !== -1) {
                        targetIndex = foundIndex;
                    }
                // selectionHintが数値（インデックス）の場合 (リロード時)
                } else if (typeof selectionHint === 'number') {
                    targetIndex = selectionHint;
                }

                populateNpcSelector(fullSaveData.npcs, targetIndex);
                dataDependentControls.classList.remove('hidden');
                dataDependentControlsBottom.classList.remove('hidden');
                setFormEnabled(true); // フォームを有効化
                filterNpcList(); // NPCリスト生成後にフィルタリングを再実行
            } else {
                alert(i18n[currentLang].alert_no_npcs_array);
                resetEditor();
            }
        } catch (error) {
            alert(i18n[currentLang].alert_json_parse_error + error);
            resetEditor();
        }
    }

    // ===== エディタを初期状態に戻す処理 =====
    function resetEditor() {
        fullSaveData = null;
        dataDependentControls.classList.add('hidden');
        dataDependentControlsBottom.classList.add('hidden');
        setFormEnabled(false); // フォームを無効化
        fileInput.value = '';
        fileNameDisplay.textContent = i18n[currentLang].no_file_selected;
    }



    // ===== UMA個別UIの変更をJSONエディタに反映する関数 =====
    function updateUmaRecipeFromInputs() {
        if (isUpdatingFromJson) return;

        try {
            const npcData = JSON.parse(jsonEditor.value);
            if (!npcData.umaRecipe) return;

            const umaRecipe = JSON.parse(npcData.umaRecipe);
            if (!umaRecipe.dna || !umaRecipe.dna[0] || !umaRecipe.dna[0].packedDna) return;

            const packedDna = JSON.parse(umaRecipe.dna[0].packedDna);
            const dnaSettings = packedDna.bDnaSettings;

            // DNA項目の更新
            dnaSettings.forEach(dnaItem => {
                const inputElement = document.getElementById(`uma-input-${dnaItem.name}`);
                if (inputElement) {
                    let value = inputElement.value;
                    if (value === '') {
                        inputElement.classList.add('input-null-warning');
                    } else {
                        inputElement.classList.remove('input-null-warning');
                    }
                    dnaItem.value = value === '' ? null : (parseFloat(value) || 0);
                }
            });

            // wardrobeSetの値を更新
            const wardrobeSet = umaRecipe.wardrobeSet;
            if (Array.isArray(wardrobeSet)) {
                wardrobeSet.forEach(item => {
                    const inputElement = document.getElementById(`uma-wardrobe-input-${item.slot}`);
                    if (inputElement) {
                        let value = inputElement.value;
                        if (value === '') {
                            inputElement.classList.add('input-null-warning');
                        } else {
                            inputElement.classList.remove('input-null-warning');
                        }
                        item.recipe = value;
                    }
                });
            }

            // characterColorsの値を更新
            const characterColors = umaRecipe.characterColors;
            if (Array.isArray(characterColors)) {
                characterColors.forEach(item => {
                    const inputElement = document.getElementById(`uma-color-input-${item.name}`);
                    if (inputElement) {
                        const hex = inputElement.value; // #RRGGBB
                        // 16進数カラーコードをRGB配列に変換し、先頭3つの値のみを更新
                        const r = parseInt(hex.substring(1, 3), 16);
                        const g = parseInt(hex.substring(3, 5), 16);
                        const b = parseInt(hex.substring(5, 7), 16);

                        if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
                            item.colors[0] = r;
                            item.colors[1] = g;
                            item.colors[2] = b;
                        }
                    }
                });
            }

            umaRecipe.dna[0].packedDna = JSON.stringify(packedDna);
            npcData.umaRecipe = JSON.stringify(umaRecipe);

            // 外見が変更されたので、古いポートレートを削除する
            npcData.portrait = null;

            jsonEditor.value = JSON.stringify(npcData, null, 2);
        } catch (e) {
            console.error("Error updating UMA recipe:", e);
        }
    }

    // ===== JSONエディタの内容が変更されたときに個別UIを更新する関数 =====
    function updateIndividualInputsFromJson() {
        if (isUpdatingFromJson) return;

        try {
            const currentNpcData = JSON.parse(jsonEditor.value);
            isUpdatingFromJson = true;
            updateIndividualInputs(currentNpcData);

            // JSONエディタからUMAフォームへの反映も行う
            updateUmaInputs(currentNpcData);
            updateTraitsInputs(currentNpcData); // Traitsも更新
            updateEquipsInputs(currentNpcData); // 装備品も更新
            isUpdatingFromJson = false;
        } catch (e) {
            console.error("Error updating individual inputs from JSON:", e);
            // JSONが無効な場合は、エラーを表示するなどの処理を追加できます
        }
    }

    // ===== 個別UIの変更をJSONエディタにリアルタイム反映する関数 =====
    function updateJsonEditorFromInputs() {
        if (isUpdatingFromJson) return; // JSONからの更新中は処理しない

        try {
            const currentNpcData = JSON.parse(jsonEditor.value);
            
            editableGroups.forEach(group => {
                group.fields.forEach(field => {
                    const inputElement = document.getElementById(`input-${field.key}`);
                    if (!inputElement) return;

                    let value = inputElement.value;

                    // 警告スタイルの制御
                    if (value === '') {
                        inputElement.classList.add('input-null-warning');
                    } else {
                        inputElement.classList.remove('input-null-warning');
                    }

                    // 値の型変換
                    if (value === '' || value === null) {
                        value = null; // 空文字はnullとして扱う
                    } else if (field.type === 'checkbox') {
                        value = inputElement.checked; // チェックボックスの状態(true/false)をそのまま使う
                    } else if (field.type === 'number' || field.type === 'select') {
                        // selectも数値として扱う
                        const num = parseFloat(value);
                        value = isNaN(num) ? null : num;
                    }

                    let targetObject = currentNpcData;
                    if (field.path) {
                        targetObject = field.path.reduce((obj, key) => {
                            if (!obj[key]) obj[key] = {}; // 途中のオブジェクトがなければ作成
                            return obj[key];
                        }, currentNpcData);
                    }
                    
                    targetObject[field.key] = value;

                    // ★★★ 基礎ステータス変更時に、補正後ステータスにも差分を反映 ★★★
                    if (field.key.startsWith('BS')) {
                        const baseKey = field.key; // 例: "BSstrength"
                        const finalKey = baseKey.substring(2); // 例: "strength"
                        const finalKeyLower = finalKey.toLowerCase(); // 補正後キーは小文字の場合がある

                        // 基礎値の元の値を取得する場所を特定
                        const originalBaseSource = field.path && field.path.includes('humanTalent') 
                            ? currentNpcOriginalData.humanTalent 
                            : currentNpcOriginalData.humanAttribute;

                        // 差分を計算
                        const originalValue = (originalBaseSource || {})[baseKey] || 0;
                        const diff = value - originalValue;

                        // 補正後ステータスに差分を加算
                        if (currentNpcData.hasOwnProperty(finalKeyLower)) {
                            currentNpcData[finalKeyLower] = (currentNpcOriginalData[finalKeyLower] || 0) + diff;
                        }
                    }
                });
            });

            // Traitsの値を収集して更新
            const traitInputs = traitsList.querySelectorAll('input[type="number"]');
            const newTraits = [];
            traitInputs.forEach(input => {
                if (input.value.trim() !== '') {
                    newTraits.push(parseFloat(input.value));
                }
            });
            currentNpcData.traits = newTraits;

            // 装備品の値を収集して更新
            const newEquips = [];
            for (let i = 0; i < 10; i++) {
                const listContainer = document.getElementById('equips-list');
                if (!listContainer) continue;
                const slotContainer = listContainer.querySelector(`.equip-item:nth-child(${i + 1})`);
                if (!slotContainer || !slotContainer.querySelector('.equip-fields')) {
                    newEquips.push(null);
                    continue;
                }

                const equipData = {};
                // ★★★ 非常に重要: slotIndexを必ず設定する ★★★
                equipData.slotIndex = i;

                const fields = slotContainer.querySelectorAll('.equip-fields [data-key]');
                let hasId = false;
                fields.forEach(input => {
                    const key = input.dataset.key;
                    let value;
                    if (input.type === 'checkbox') {
                        value = input.checked;
                    } else {
                        const numValue = (input.tagName === 'SELECT') ? parseInt(input.value, 10) : parseFloat(input.value);
                        value = isNaN(numValue) ? null : numValue;
                    }

                    equipData[key] = value;

                    if (key === 'id' && !isNaN(value) && value > 0) {
                        hasId = true;
                    }
                });

                if (!hasId) { // IDが0や未入力なら装備なしとみなす
                    newEquips.push(null);
                    continue;
                }

                const addAttrs = [];
                const attrItems = slotContainer.querySelectorAll('.add-attr-item');
                attrItems.forEach(item => {
                    const typeInput = item.querySelector('input[data-key="type"]');
                    const valueInput = item.querySelector('input[data-key="value"]');
                    const levelAlterInput = item.querySelector('input[data-key="levelAlter"]');
                    if (typeInput && valueInput && levelAlterInput) {
                        addAttrs.push({
                            type: parseInt(typeInput.value) || 0,
                            value: parseFloat(valueInput.value) || 0,
                            levelAlter: parseInt(levelAlterInput.value) || 0
                        });
                    }
                });
                equipData.addAttrs = addAttrs;
                newEquips.push(equipData);
            }
            currentNpcData.equips = newEquips;

            // 外見データ(umaRecipe)が変更されたかチェックし、変更されていればportraitをnullにする
            const originalUmaRecipe = currentNpcOriginalData ? currentNpcOriginalData.umaRecipe : null;
            if (currentNpcData.umaRecipe !== originalUmaRecipe) {
                currentNpcData.portrait = null;
            }

            isUpdatingFromJson = true;
            jsonEditor.value = JSON.stringify(currentNpcData, null, 2);
            isUpdatingFromJson = false;

        } catch(e) {
            console.error("Error updating JSON editor:", e);
        }
    }

    // ===== イベントリスナーの設定 =====
    npcSelector.addEventListener('change', (e) => {
        onNpcSelectionChange(e.target.value);
    });

    // 「Traitを追加」ボタンのイベントリスナー
    addTraitButton.addEventListener('click', () => {
        createTraitInput();
        updateJsonEditorFromInputs(); // 追加をJSONに反映
    });

    // JSONエディタの変更を監視
    jsonEditor.addEventListener('input', updateIndividualInputsFromJson);

    // リロードボタンのイベントリスナー
    if (reloadButton) {
        reloadButton.addEventListener('click', () => {
            if (confirm(i18n[currentLang].alert_reload_confirm)) {
                const currentIndex = currentNpcIndex; // 現在選択中のインデックスを保持
                // 保持しているFileオブジェクト、またはfileInputからファイルを取得
                const fileToReload = loadedFileObject || fileInput.files[0];
                if (fileToReload) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        loadAndDisplayData(e.target.result, currentIndex); // 保持したインデックスを渡す
                    };
                    reader.readAsText(fileToReload);
                }
            }
        });
    }


    // ===== NPCリストを検索語でフィルタリングする関数 =====
    function filterNpcList() {
        const searchTerm = npcSearch.value.toLowerCase();
        Array.from(npcSelector.options).forEach(option => {
            option.style.display = option.textContent.toLowerCase().includes(searchTerm) ? '' : 'none';
        });
    }

    // 検索入力時にフィルタリングを実行
    npcSearch.addEventListener('input', filterNpcList);
    // ===== 保存ボタンの処理 =====
    saveButton.addEventListener('click', () => {
        if (!fullSaveData) return;
        try {
            // Google Analyticsにイベントを送信
            if (typeof gtag === 'function') {
                gtag('event', 'save_file', {
                    'event_category': 'Editor Action',
                    'event_label': 'Save Button Click'
                });
            }

            // ヘルパー関数: 非ASCII文字を \uXXXX 形式にエスケープする
            function escapeNonAscii(str) {
                return str.replace(/[\u007f-\uffff]/g, c => '\\u' + ('0000' + c.charCodeAt(0).toString(16).toUpperCase()).slice(-4));
            }

            const editedNpcData = JSON.parse(jsonEditor.value);
            fullSaveData.npcs[npcSelector.value] = editedNpcData;
            let minifiedJsonString = JSON.stringify(fullSaveData);
            minifiedJsonString = escapeNonAscii(minifiedJsonString); // ゲームの形式に合わせてエスケープ
            
            const blob = new Blob([minifiedJsonString], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'sav.dat';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            alert(i18n[currentLang].alert_save_error + error);
        }
    });

    // ===== 外見プリセットの保存処理 =====
    savePresetButton.addEventListener('click', () => {
        if (!currentNpcOriginalData) {
            alert(i18n[currentLang].alert_preset_save_no_char);
            return;
        }

        try {
            const currentNpcData = JSON.parse(jsonEditor.value);
            const umaRecipeString = currentNpcData.umaRecipe;

            if (!umaRecipeString) {
                alert(i18n[currentLang].alert_preset_save_no_uma);
                return;
            }

            const blob = new Blob([umaRecipeString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${currentNpcData.unitname || 'preset'}_appearance.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (e) {
            alert(i18n[currentLang].alert_preset_save_error + e);
        }
    });

    // ===== 外見プリセットの読み込み処理 =====
    // ファイル選択ダイアログが開くたびにinputの値をリセットする
    // これにより、同じファイルを連続で選択してもchangeイベントが発火するようになる
    loadPresetInput.addEventListener('click', (event) => {
        event.target.value = null;
    });

    loadPresetInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const umaRecipeString = e.target.result;
            const currentNpcData = JSON.parse(jsonEditor.value);
            currentNpcData.umaRecipe = umaRecipeString;
            currentNpcData.portrait = null;
            jsonEditor.value = JSON.stringify(currentNpcData, null, 2);
            // UIを更新
            updateIndividualInputsFromJson();
        };
        reader.readAsText(file);
    });

});