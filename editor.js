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
    const umaEditorForm = document.getElementById('uma-editor-form');
    const umaUnavailableMessage = document.getElementById('uma-unavailable-message');
    const savePresetButton = document.getElementById('save-preset-button');
    const loadPresetInput = document.getElementById('load-preset-input');
    const enableJsonEdit = document.getElementById('enableJsonEdit');

    // 読み込んだセーブデータ全体を保持
    let fullSaveData = null;
    let originalFileName = 'save_edited.dat';
    let currentNpcOriginalData = null; // 選択中のNPCの初期データを保持
    let currentNpcOriginalUmaDna = null; // 選択中のNPCの初期UMA DNAデータを保持
    let currentNpcIndex = null; // 現在選択/編集中のNPCのインデックス
    let isUpdatingFromJson = false; // JSONエディタからの更新中フラグ

    // ★★★ 編集対象の項目リストを定義 ★★★
    const editableFields = [
        { key: 'unitname', label: '名前', type: 'text', readonly: true },
        { key: 'exp', label: '経験値', type: 'number' },
        { 
            key: 'gender', 
            label: '性別', 
            type: 'select', 
            options: [
                { value: 1, text: '男性' },
                { value: 2, text: '女性' }
            ] 
        },
        { 
            key: 'race', 
            label: '種族', 
            type: 'select',
            options: [
                { value: 1, text: '人間' },
                { value: 2, text: 'エルフ' },
                { value: 3, text: 'ドワーフ' },
                { value: 4, text: 'ブルートマン' }
            ]
        },
        { key: 'subRace', label: 'サブ種族', type: 'number' },
        { key: 'potential', label: 'ポテンシャル', type: 'number', path: ['humanAttribute'] },
        { key: 'BSstrength', label: '筋力', type: 'number', path: ['humanAttribute'] },
        { key: 'BSendurance', label: '耐久', type: 'number', path: ['humanAttribute'] },
        { key: 'BSagility', label: '敏捷', type: 'number', path: ['humanAttribute'] },
        { key: 'BSprecision', label: '器用', type: 'number', path: ['humanAttribute'] },
        { key: 'BSintelligence', label: '知力', type: 'number', path: ['humanAttribute'] },
        { key: 'BSwillpower', label: '精神', type: 'number', path: ['humanAttribute'] },
        { key: 'BSPersuade', label: '説得', type: 'number', path: ['humanTalent'] },
        { key: 'BSBargain', label: '交渉', type: 'number', path: ['humanTalent'] },
        { key: 'BSIntimidate', label: '威圧', type: 'number', path: ['humanTalent'] },
        { key: 'BSPathfind', label: '探索', type: 'number', path: ['humanTalent'] },
        { key: 'BSInsight', label: '洞察', type: 'number', path: ['humanTalent'] },
        { key: 'BSSneak', label: '隠密', type: 'number', path: ['humanTalent'] },
        { key: 'BSMechanics', label: '機械', type: 'number', path: ['humanTalent'] },
        { key: 'BSTheft', label: '盗み', type: 'number', path: ['humanTalent'] },
        { key: 'BSScholarly', label: '学識', type: 'number', path: ['humanTalent'] },
        { key: 'BSSmithing', label: '鍛冶', type: 'number', path: ['humanTalent'] },
        { key: 'BSAlchemy', label: '錬金', type: 'number', path: ['humanTalent'] },
        { key: 'BSCooking', label: '料理', type: 'number', path: ['humanTalent'] },
        { key: 'BSMedical', label: '医療', type: 'number', path: ['humanTalent'] },
        { key: 'BSTraining', label: '訓練', type: 'number', path: ['humanTalent'] },
        { key: 'BSTorture', label: '拷問', type: 'number', path: ['humanTalent'] },
        { key: 'unitVoice', label: 'ボイス', type: 'number' },
        { key: 'voiceVolume', label: '音量', type: 'number', step: 0.1 },
        { key: 'voicePitch', label: 'ピッチ', type: 'number', step: 0.01 },
        { key: 'health', label: '体力', type: 'number' },
        { key: 'morale', label: '士気', type: 'number' },
        { key: 'vigor', label: '活力', type: 'number' },
        { key: 'satiety', label: '満腹度', type: 'number' }
    ];

    // ★★★ Trait IDと名称の対応表 ★★★
    const traitIdToName = {
        34: "しなやか",
        37: "利発",
        70: "美貌",
        85: "熱心",
        229:"せっかち",
        230: "辛抱強い",
        247: "幸運",
        249: "機会主義者",
        250: "過度な慎重",

        352: "鍛造習得"
        // 今後判明したIDと名称をここに追加していく
    };

    // ===== 最初に個別フォームを生成 =====
    function createIndividualForm() {
        individualForm.innerHTML = '';
        editableFields.forEach(field => {
            const div = document.createElement('div');
            const label = document.createElement('label');
            label.htmlFor = `input-${field.key}`;
            label.textContent = field.label;
            
            let inputElement;

            if (field.type === 'select') {
                inputElement = document.createElement('select');
                inputElement.id = `input-${field.key}`;
                if (field.options) {
                    field.options.forEach(opt => {
                        const option = document.createElement('option');
                        option.value = opt.value;
                        option.textContent = opt.text;
                        inputElement.appendChild(option);
                    });
                }
            } else { // 'text', 'number'
                inputElement = document.createElement('input');
                inputElement.type = field.type;
                inputElement.id = `input-${field.key}`;
                if (field.step) inputElement.step = field.step;
                if (field.readonly) {
                    inputElement.readOnly = true;
                    inputElement.style.backgroundColor = '#e9ecef';
                }
            }
            if (!field.readonly) inputElement.addEventListener('input', updateJsonEditorFromInputs);

            div.appendChild(label);
            div.appendChild(inputElement);
            individualForm.appendChild(div);
        });
    }
    createIndividualForm();


    // ===== ファイル選択時の処理 =====
    // ファイル選択ダイアログが開くたびにinputの値をリセットする
    // これにより、同じファイルを連続で選択してもchangeイベントが発火するようになる
    fileInput.addEventListener('click', (event) => {
        event.target.value = null;
    });

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        // 読み込み前に、現在選択中のNPCの情報を保持しておく
        const currentNpcInfo = (fullSaveData && currentNpcIndex !== null) ? {
            unitId: fullSaveData.npcs[currentNpcIndex].unitId,
            unitname: fullSaveData.npcs[currentNpcIndex].unitname
        } : null;

        // ファイル読み込み処理の開始時に、現在の選択とメモリ上のデータをリセットする
        currentNpcIndex = null;
        fullSaveData = null; 

        originalFileName = file.name;
        const reader = new FileReader();

        reader.onload = (e) => {
            // 保持したNPC情報をヒントとして渡す
            loadAndDisplayData(e.target.result, currentNpcInfo);
        };
        reader.onerror = () => alert('ファイルの読み込みに失敗しました。');
        reader.readAsText(file);
    });

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
        editableFields.forEach(field => {
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
                    newOption.textContent = `不明 (${value})`;
                    inputElement.appendChild(newOption);
                }
            }

            inputElement.value = (value !== null && value !== undefined) ? value : '';
            if (value === '' || value === null) {
                inputElement.classList.add('input-null-warning');
            } else {
                inputElement.classList.remove('input-null-warning');
            }
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
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.marginBottom = '5px';

        const input = document.createElement('input');
        input.type = 'number';
        input.value = value;
        input.style.flexGrow = '1';
        input.placeholder = 'Trait ID';
        if (input.value === '') {
            input.classList.add('input-null-warning');
        } else {
            input.classList.remove('input-null-warning');
        }

        const nameLabel = document.createElement('span');
        nameLabel.style.marginLeft = '10px';
        nameLabel.style.fontSize = '12px';
        nameLabel.style.whiteSpace = 'nowrap'; // 名前が改行されないように

        const updateNameLabel = (id) => {
            const traitName = traitIdToName[id];
            nameLabel.textContent = traitName || '';
        };

        input.addEventListener('input', () => {
            updateNameLabel(input.value);
            updateJsonEditorFromInputs();
        });

        const removeBtn = document.createElement('button');
        removeBtn.textContent = '削除';
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

    // ===== UMAレシピから個別UIに値をセットする関数 =====
    function updateUmaInputs(npcData) {
        umaEditorForm.innerHTML = ''; // フォームをクリア
        if (!npcData.umaRecipe) {
            umaEditorContainer.classList.add('hidden');
            umaUnavailableMessage.classList.remove('hidden');
            return;
        }

        umaEditorContainer.classList.remove('hidden');
        umaUnavailableMessage.classList.add('hidden');

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
                editorArea.classList.remove('hidden');
                filterNpcList(); // NPCリスト生成後にフィルタリングを再実行
            } else {
                alert('セーブデータ内に "npcs" 配列が見つかりませんでした。');
                resetEditor();
            }
        } catch (error) {
            alert('JSONファイルとして解析できませんでした。\n' + error);
            resetEditor();
        }
    }

    // ===== エディタを初期状態に戻す処理 =====
    function resetEditor() {
        fullSaveData = null;
        editorArea.classList.add('hidden');
        fileInput.value = '';
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
            
            editableFields.forEach(field => {
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

            // Traitsの値を収集して更新
            const traitInputs = traitsList.querySelectorAll('input[type="number"]');
            const newTraits = [];
            traitInputs.forEach(input => {
                if (input.value.trim() !== '') {
                    newTraits.push(parseFloat(input.value));
                }
            });
            currentNpcData.traits = newTraits;

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
            const currentIndex = currentNpcIndex; // 現在選択中のインデックスを保持
            const fileInput = document.getElementById('fileInput');
            const file = fileInput.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    loadAndDisplayData(e.target.result, currentIndex); // 保持したインデックスを渡す
                };
                reader.readAsText(file);
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
            const editedNpcData = JSON.parse(jsonEditor.value);
            fullSaveData.npcs[npcSelector.value] = editedNpcData;
            const minifiedJsonString = JSON.stringify(fullSaveData);
            
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
            alert('JSONの形式が正しくありません。保存できません。\n' + error);
        }
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
                editorArea.classList.remove('hidden');
                filterNpcList(); // NPCリスト生成後にフィルタリングを再実行
            } else {
                alert('セーブデータ内に "npcs" 配列が見つかりませんでした。');
                resetEditor();
            }
        } catch (error) {
            alert('JSONファイルとして解析できませんでした。\n' + error);
            resetEditor();
        }
    }




    // ===== エディタを初期状態に戻す処理 =====
    function resetEditor() {
        fullSaveData = null;
        editorArea.classList.add('hidden');
        fileInput.value = '';
    }

    // ===== 外見プリセットの保存処理 =====
    savePresetButton.addEventListener('click', () => {
        if (!currentNpcOriginalData) {
            alert('キャラクターが選択されていません。');
            return;
        }

        try {
            const currentNpcData = JSON.parse(jsonEditor.value);
            const umaRecipeString = currentNpcData.umaRecipe;

            if (!umaRecipeString) {
                alert('現在のキャラクターに外見データがありません。');
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
            alert('プリセットの保存中にエラーが発生しました。\n' + e);
        }
    });

    // ===== 外見プリセットの読み込み処理 =====
    loadPresetInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const umaRecipeString = e.target.result;
            const currentNpcData = JSON.parse(jsonEditor.value);
            currentNpcData.umaRecipe = umaRecipeString;
            jsonEditor.value = JSON.stringify(currentNpcData, null, 2);
            // UIを更新
            updateIndividualInputsFromJson();
        };
        reader.readAsText(file);
    });

});