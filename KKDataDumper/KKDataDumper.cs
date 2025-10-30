using BepInEx;
using BepInEx.Logging;
using DuloGames.UI;
using System.Collections;
using System.IO;
using System.Linq;
using System.Text;
using System.Collections.Generic; 
using UnityEngine;
using I2.Loc;
using UMA; // UMATextRecipe を使用するために追加

internal static class ModInfo
{
    internal const string Guid = "kk.aor.datadumper";
    internal const string Name = "KK Data Dumper";
    internal const string Version = "1.1.0";
}

[BepInPlugin(ModInfo.Guid, ModInfo.Name, ModInfo.Version)]
public class KKDataDumper : BaseUnityPlugin
{
    internal static ManualLogSource Log;

    void Awake()
    {
        Log = Logger;
        Log.LogInfo("KK Data Dumper is initializing...");
    }

    void Start()
    {
        StartCoroutine(WaitForGameManager());
    }

    private IEnumerator WaitForGameManager()
    {
        Log.LogInfo("Waiting for gameManager to be ready...");
        while (gameManager.GM == null)
        {
            yield return null;
        }

        Log.LogInfo("gameManager found! Subscribing to onGameStart event.");
        gameManager.GM.onGameStart.AddListener(OnGameStart);
    }

    private void OnGameStart()
    {
        StartCoroutine(DumpWhenReady());
        if (gameManager.GM != null)
        {
            gameManager.GM.onGameStart.RemoveListener(OnGameStart);
            Log.LogInfo("Unsubscribed from onGameStart event.");
        }
    }

    private IEnumerator DumpWhenReady()
    {
        Log.LogInfo("onGameStart fired. Now waiting for databases to be populated...");

        while (UITalentDatabase.Instance == null || UIItemDatabase.Instance == null || UISpellDatabase.Instance == null || UIBuffDatabase.Instance == null ||
               UITalentDatabase.Instance.talents.Length == 0 || UIItemDatabase.Instance.items.Length == 0)
        {
            Log.LogInfo("Databases are not ready yet, waiting 0.5 seconds...");
            yield return new WaitForSeconds(0.5f);
        }

        Log.LogInfo($"Databases are populated! Talents: {UITalentDatabase.Instance.talents.Length}, Items: {UIItemDatabase.Instance.items.Length}.");

        // 1. ManagementModeCoreから、数値のバージョンと接尾辞を取得します。
        string gameVersionNumber = ManagementModeCore.currerntVersion.ToString("F2"); // "F2"で小数点以下2桁を保証 (1.06)
        string gameVersionSuffix = ManagementModeCore.versionSuffix;

        // 2. それらを組み合わせて、公式のアナウンスと同じバージョン文字列を作成します。
        string fullGameVersion = gameVersionNumber + gameVersionSuffix; // "1.06" + "b" = "1.06b"
        
        Log.LogInfo($"Accurate game version detected: {fullGameVersion}");

        string modDirectory = Path.GetDirectoryName(Info.Location);
        string versionFolderPath = Path.Combine(modDirectory, fullGameVersion);

        if (!Directory.Exists(versionFolderPath))
        {
            Log.LogInfo($"Directory '{versionFolderPath}' not found. Creating new directory and dumping all data...");
            Directory.CreateDirectory(versionFolderPath);

            DumpTalentsAndTraits(versionFolderPath);
            DumpItems(versionFolderPath);
            DumpAddonAttributes(versionFolderPath);
            DumpSpells(versionFolderPath);
            DumpBuffs(versionFolderPath);
            DumpUmaRecipes(versionFolderPath); // ★★★ UMAレシピのダンプ処理を呼び出し ★★★
            DumpRaceData(versionFolderPath); // ★★★ RaceDataのダンプ処理を呼び出し ★★★
            DumpDnaConverters(versionFolderPath); // ★★★ DNAコンバーターのダンプ処理を呼び出し ★★★
            DumpLocalizationData(versionFolderPath);
            DumpBaseRaceRecipes(versionFolderPath); // ★★★ ベースレシピのダンプ処理を呼び出し ★★★
            DumpSlotDataAssets(versionFolderPath); // ★★★ SlotDataAssetのダンプ処理を呼び出し ★★★

            Log.LogInfo("All data dump tasks complete for new version.");
        }
        else
        {
            Log.LogInfo("Data for this version already exists. Skipping dump.");
        }
    }

    private void DumpTalentsAndTraits(string outputDirectory)
    {
        if (UITalentDatabase.Instance == null)
        {
            Log.LogError("DumpTalentsAndTraits: UITalentDatabase not found!");
            return;
        }

        var csv = new StringBuilder();
        csv.AppendLine("ID,Type,Name,RejectedTraits_IDs,RejectedTraits_Names");

        foreach (var talentInfo in UITalentDatabase.Instance.talents)
        {
            if (talentInfo == null) continue;
            var rejectedIds = talentInfo.rejectedTraits.Select(t => t != null ? t.ID.ToString() : "NULL");
            var rejectedNames = talentInfo.rejectedTraits.Select(t => t != null ? t.Name : "NULL");
            var line = string.Format("{0},{1},\"{2}\",\"{3}\",\"{4}\"",
                talentInfo.ID, talentInfo.type, talentInfo.Name,
                string.Join(";", rejectedIds), string.Join(";", rejectedNames));
            csv.AppendLine(line);
        }

        string filePath = Path.Combine(outputDirectory, "TalentAndTrait_List.csv");
        File.WriteAllText(filePath, csv.ToString());
        Log.LogInfo($"  -> Dumped {UITalentDatabase.Instance.talents.Length} Talents/Traits to {filePath}");
    }

    private void DumpItems(string outputDirectory)
    {
        if (UIItemDatabase.Instance == null)
        {
            Log.LogError("DumpItems: UIItemDatabase not found!");
            return;
        }

        var csv = new StringBuilder();
        csv.AppendLine("ID,Name,ItemType,EquipType");

        foreach (var itemInfo in UIItemDatabase.Instance.items)
        {
            if (itemInfo == null) continue;
            string equipType = (itemInfo is UIEquipmentInfo eq) ? eq.EquipType.ToString() : "";
            var line = string.Format("{0},\"{1}\",{2},{3}",
                itemInfo.ID, itemInfo.Name, itemInfo.itemType, equipType);
            csv.AppendLine(line);
        }

        string filePath = Path.Combine(outputDirectory, "Item_List.csv");
        File.WriteAllText(filePath, csv.ToString());
        Log.LogInfo($"  -> Dumped {UIItemDatabase.Instance.items.Length} Items to {filePath}");
    }

    private void DumpAddonAttributes(string outputDirectory)
    {
        if (UIItemDatabase.Instance == null)
        {
            Log.LogError("DumpAddonAttributes: UIItemDatabase not found!");
            return;
        }

        var csv = new StringBuilder();
        // ★★★ ヘッダーに "LocalizationKey" を追加 ★★★
        csv.AppendLine("SourceList,AttributeID,AttributeType,LocalizationKey,Value,LevelAlter");

        var listsToDump = new[]
        {
            ("Total", UIItemDatabase.Instance.totalAttributes), ("Weapon", UIItemDatabase.Instance.weaponAttributes),
            ("Shield", UIItemDatabase.Instance.shieldAttributes), ("Head", UIItemDatabase.Instance.headAttributes),
            ("Chest", UIItemDatabase.Instance.chestAttributes), ("Legs", UIItemDatabase.Instance.legsAttributes),
            ("Ornaments", UIItemDatabase.Instance.ornamentsAttributes)
        };

        foreach (var (sourceName, attributeList) in listsToDump)
        {
            if (attributeList == null) continue;
            foreach (var attr in attributeList)
            {
                // ★★★ 変換関数を呼び出して、正しいキーを取得 ★★★
                string localizationKey = GetLocalizationKeyForAddon(attr.type);

                var line = string.Format("\"{0}\",{1},{2},\"{3}\",{4},{5}",
                    sourceName,
                    (int)attr.type,
                    attr.type,
                    localizationKey, // ← 新しい列を追加
                    attr.value,
                    attr.levelAlter
                );
                csv.AppendLine(line);
            }
        }

        string filePath = Path.Combine(outputDirectory, "AddonAttribute_List.csv");
        File.WriteAllText(filePath, csv.ToString());
        Log.LogInfo($"  -> Dumped AddonAttributes with Localization Keys to {filePath}");
    }

    // ★★★ UITalentInfo.CreateDescriptionのロジックを再現したヘルパー関数 ★★★
    private string GetLocalizationKeyForAddon(AddonAttribute attr)
    {
        string enumName = attr.ToString();

        // UITalentInfo.CreateDescription の switch文のロジックを完全に再現します
        switch (attr)
        {
            // === グループ1：ハードコーディングされたキー ===
            case AddonAttribute.Attack:                     return "Accuracy";
            case AddonAttribute.Defence:                    return "Block Rate";
            case AddonAttribute.Crit:                       return "Crit Rate";
            case AddonAttribute.CritMultiple:               return "Crit Damage";
            case AddonAttribute.HPrestore:                  return "HP restore";
            case AddonAttribute.EPrestore:                  return "EP restore";
            case AddonAttribute.MPrestore:                  return "MP restore";
            case AddonAttribute.EPsave:                     return "EP Save";
            case AddonAttribute.BlockEPsave:                return "BlockEP Save";
            case AddonAttribute.CooldownReduce:             return "Cooldown Reduce";
            case AddonAttribute.DamageIncrease:             return "Tooltip_Buff_DamageIncrease";
            case AddonAttribute.DamageReduce:               return "Tooltip_Buff_DamageReduce";
            case AddonAttribute.MeleeDamage:                return "Tooltip_Buff_MeleeDamage";
            case AddonAttribute.RangeDamage:                return "Tooltip_Buff_RangeDamage";
            case AddonAttribute.MagicDamage:                return "Tooltip_Buff_MagicDamage";
            case AddonAttribute.StaminaDamage:              return "Tooltip_Buff_StaminaDamage";
            case AddonAttribute.SummonDamageBonus:          return "Tooltip_Buff_SummonDamageBonus";
            case AddonAttribute.SummonHealthBonus:          return "Tooltip_Buff_SummonHealthBonus";
            case AddonAttribute.HPPercent:                  return "Tooltip_Buff_HPPercent";
            case AddonAttribute.HealMD:                     return "Tooltip_Buff_HealMD";
            case AddonAttribute.AttackSpeed:                return "Attack Speed";
            case AddonAttribute.TimeSpeed:                  return "Time Speed";
            case AddonAttribute.AttackRange:                return "Attack Range";
            case AddonAttribute.AttackAngle:                return "Attack Angle";
            case AddonAttribute.WeaponForce:                return "Weapon Force";
            case AddonAttribute.BlockAngle:                 return "Block Angle";
            case AddonAttribute.MoveSpeed:                  return "Move Speed";
            case AddonAttribute.PDR:                        return "Tenacity";
            case AddonAttribute.MDR:                        return "Volition";
            case AddonAttribute.Threat:                     return "Threat";

            // === グループ2：動的生成 (Damage Resistance) ===
            case AddonAttribute.SharpDamageResistance:
            case AddonAttribute.BluntDamageResistance:
            case AddonAttribute.StabDamageResistance:
            case AddonAttribute.FlameDamageResistance:
            case AddonAttribute.ColdDamageResistance:
            case AddonAttribute.ElectricDamageResistance:
            case AddonAttribute.PoisonDamageResistance:
            case AddonAttribute.PositiveDamageResistance:
            case AddonAttribute.NegativeDamageResistance:
                return ((DamageType)(attr - 100)).ToString() + " resistance";

            // === グループ3：動的生成 (Resistance Penetration) ===
            case AddonAttribute.SharpResistancePenetration:
            case AddonAttribute.BluntResistancePenetration:
            case AddonAttribute.StabResistancePenetration:
            case AddonAttribute.FlameResistancePenetration:
            case AddonAttribute.ColdResistancePenetration:
            case AddonAttribute.ElectricResistancePenetration:
            case AddonAttribute.PoisonResistancePenetration:
            case AddonAttribute.PositiveResistancePenetration:
            case AddonAttribute.NegativeResistancePenetration:
                return ((DamageType)(attr - 200)).ToString() + " Penetration";

            // === グループ4：動的生成 (種族ダメージ修飾子) ===
            case AddonAttribute.HumanDamageModifier:
            case AddonAttribute.ElfDamageModifier:
            case AddonAttribute.DwarfDamageModifier:
            case AddonAttribute.BrutemanDamageModifier:
            case AddonAttribute.LizardDamageModifier:
            case AddonAttribute.FairyDamageModifier:
            case AddonAttribute.DemonDamageModifier:
            case AddonAttribute.UndeadDamageModifier:
            case AddonAttribute.OrcDamageModifier:
            case AddonAttribute.MythologicalDamageModifier:
            case AddonAttribute.AnimalDamageModifier:
            case AddonAttribute.InsectDamageModifier:
                return "Tooltip_Buff_" + enumName.Replace("Modifier", "");
            
            // === グループ5：動的生成 (魔法ダメージ修飾子) ===
            case AddonAttribute.SharpSpellDamageModifier:
            case AddonAttribute.BluntSpellDamageModifier:
            case AddonAttribute.StabSpellDamageModifier:
            case AddonAttribute.FlameSpellDamageModifier:
            case AddonAttribute.ColdSpellDamageModifier:
            case AddonAttribute.ElectricSpellDamageModifier:
            case AddonAttribute.PoisonSpellDamageModifier:
            case AddonAttribute.PositiveSpellDamageModifier:
            case AddonAttribute.NegativeSpellDamageModifier:
                return ((DamageType)(attr - 400)).ToString() + " bonus";

            // === デフォルト：enum名がそのままキーになるケース ===
            // (Strength, Endurance, HP, EP, MP, Persuade など)
            default:
                return enumName;
        }
    }

    private void DumpSpells(string outputDirectory)
    {
        if (UISpellDatabase.Instance == null)
        {
            Log.LogError("DumpSpells: UISpellDatabase not found!");
            return;
        }

        var csv = new StringBuilder();
        csv.AppendLine("ID,Name,Description");

        foreach (var spellInfo in UISpellDatabase.Instance.spells)
        {
            if (spellInfo == null) continue;
            var line = string.Format("{0},\"{1}\",\"{2}\"",
                spellInfo.ID, spellInfo.Name, spellInfo.description.Replace("\"", "\"\""));
            csv.AppendLine(line);
        }

        string filePath = Path.Combine(outputDirectory, "Spell_List.csv");
        File.WriteAllText(filePath, csv.ToString());
        Log.LogInfo($"  -> Dumped {UISpellDatabase.Instance.spells.Length} Spells to {filePath}");
    }

    // ▼▼▼ ここが修正された関数です ▼▼▼
    private void DumpBuffs(string outputDirectory)
    {
        if (UIBuffDatabase.Instance == null)
        {
            Log.LogError("DumpBuffs: UIBuffDatabase not found!");
            return;
        }

        var csv = new StringBuilder();
        csv.AppendLine("ID,BuffType,Description"); // ヘッダーを Name を含まない形に修正

        foreach (var buffInfo in UIBuffDatabase.Instance.buffs)
        {
            if (buffInfo == null) continue;

            var line = string.Format("{0},{1},\"{2}\"", // Nameプロパティへの参照を削除
                buffInfo.id,
                buffInfo.type,
                buffInfo.description.Replace("\"", "\"\""));
            csv.AppendLine(line);
        }

        string filePath = Path.Combine(outputDirectory, "Buff_List.csv");
        File.WriteAllText(filePath, csv.ToString());
        Log.LogInfo($"  -> Dumped {UIBuffDatabase.Instance.buffs.Length} Buffs to {filePath}");
    }
    
    // ▼▼▼ ここに新しい関数を追加します ▼▼▼
    private void DumpUmaRecipes(string outputDirectory)
    {
        // UMAAssetIndexerはUMAのコアコンポーネントで、アセットのインデックスを管理します。
        var assetIndexer = UMAAssetIndexer.Instance;
        if (assetIndexer == null)
        {
            Log.LogError("DumpUmaRecipes: UMAAssetIndexer not found!");
            return;
        }

        // GetAllAssets<T> を使って、ロードされている全ての UMATextRecipe を取得します。
        var allRecipes = assetIndexer.GetAllAssets<UMATextRecipe>(); // 戻り値は List<UMATextRecipe>

        if (allRecipes.Count == 0) // List<T> の要素数は .Count で取得
        {
            Log.LogWarning("DumpUmaRecipes: No UMATextRecipe assets found.");
            return;
        }

        var csv = new StringBuilder();
        // 出力する情報を定義します。特に wardrobeSlot が重要です。
        csv.AppendLine("RecipeName,WardrobeSlot,DisplayName,CompatibleRaces,SuppressSlots");

        foreach (var recipe in allRecipes)
        {
            if (recipe == null) continue;

            var compatibleRaces = string.Join(";", recipe.compatibleRaces ?? new List<string>());
            var suppressSlots = string.Join(";", recipe.suppressWardrobeSlots ?? new List<string>());
            
            var line = string.Format("\"{0}\",\"{1}\",\"{2}\",\"{3}\",\"{4}\"",
                recipe.name, recipe.wardrobeSlot, recipe.DisplayValue, compatibleRaces, suppressSlots);
            csv.AppendLine(line);
        }

        string filePath = Path.Combine(outputDirectory, "UmaRecipe_List.csv");
        File.WriteAllText(filePath, csv.ToString());
        Log.LogInfo($"  -> Dumped {allRecipes.Count} UMA Recipes to {filePath}"); // ここも .Count に修正
    }

    // ▼▼▼ ここに新しい関数を追加します ▼▼▼
    private void DumpRaceData(string outputDirectory)
    {
        var assetIndexer = UMAAssetIndexer.Instance;
        if (assetIndexer == null)
        {
            Log.LogError("DumpRaceData: UMAAssetIndexer not found!");
            return;
        }

        var allRaces = assetIndexer.GetAllAssets<RaceData>();
        if (allRaces.Count == 0)
        {
            Log.LogWarning("DumpRaceData: No RaceData assets found.");
            return;
        }

        var csv = new StringBuilder();
        csv.AppendLine("RaceName,IsDefaultWardrobe,RecipeName,WardrobeSlot");

        int totalRecipesDumped = 0;
        foreach (var race in allRaces)
        {
            // 修正: 'baseRaceRecipe' は UMARecipeBase 型であり、'wardrobeSet' を持たない。
            // 'baseRaceRecipe' を UMATextRecipe にキャストして、それがデフォルト装備のレシピであるか確認する。
            if (race == null || race.baseRaceRecipe == null) continue;

            // 'baseRaceRecipe' を UMATextRecipe 型に安全にキャストします。
            // キャストに成功した場合、defaultRecipe 変数にその値が格納されます。
            if (race.baseRaceRecipe is UMATextRecipe defaultRecipe)
            {

                // UMATextRecipe であれば、その情報を直接出力する
                if (!string.IsNullOrEmpty(defaultRecipe.wardrobeSlot))
                {
                    var line = string.Format("\"{0}\",\"{1}\",\"{2}\",\"{3}\"",
                        race.raceName, "Yes", defaultRecipe.name, defaultRecipe.wardrobeSlot);
                    csv.AppendLine(line);
                    totalRecipesDumped++;
                }
            }
        }

        string filePath = Path.Combine(outputDirectory, "RaceData_DefaultWardrobe.csv");
        File.WriteAllText(filePath, csv.ToString());
        Log.LogInfo($"  -> Dumped {totalRecipesDumped} default wardrobe recipes from {allRaces.Count} races to {filePath}");
    }

    // ▼▼▼ ここに新しい関数を追加します ▼▼▼
    private void DumpDnaConverters(string outputDirectory)
    {
        var assetIndexer = UMAAssetIndexer.Instance;
        if (assetIndexer == null)
        {
            Log.LogError("DumpDnaConverters: UMAAssetIndexer not found!");
            return;
        }

        var allRaces = assetIndexer.GetAllAssets<RaceData>();
        if (allRaces.Count == 0)
        {
            Log.LogWarning("DumpDnaConverters: No RaceData assets found.");
            return;
        }

        string dnaConverterDir = Path.Combine(outputDirectory, "DnaConverters");
        Directory.CreateDirectory(dnaConverterDir);

        int totalDumped = 0;
        foreach (var race in allRaces)
        {
            if (race == null || race.dnaRanges == null) continue;

            for (int i = 0; i < race.dnaRanges.Length; i++)
            {
                var dnaRange = race.dnaRanges[i];
                if (dnaRange == null) continue;

                string json = UnityEngine.JsonUtility.ToJson(dnaRange, true); // 完全修飾名に修正
                string fileName = $"{race.raceName}_dnaRange_{i}.json";
                File.WriteAllText(Path.Combine(dnaConverterDir, fileName), json);
                totalDumped++;
            }
        }
        Log.LogInfo($"  -> Dumped {totalDumped} DNA Converters from {allRaces.Count} races to '{dnaConverterDir}'");
    }

    // ▼▼▼ ここに新しい関数を追加します ▼▼▼
    private void DumpBaseRaceRecipes(string outputDirectory)
    {
        Log.LogInfo("Dumping all Base Race Recipes...");
        var assetIndexer = UMAAssetIndexer.Instance;
        if (assetIndexer == null)
        {
            Log.LogError("DumpBaseRaceRecipes: UMAAssetIndexer not found!");
            return;
        }

        var allRaces = assetIndexer.GetAllAssets<RaceData>();
        if (allRaces.Count == 0)
        {
            Log.LogWarning("DumpBaseRaceRecipes: No RaceData assets found.");
            return;
        }

        string baseRecipeDir = Path.Combine(outputDirectory, "BaseRaceRecipes");
        Directory.CreateDirectory(baseRecipeDir);

        int totalDumped = 0;
        foreach (var race in allRaces)
        {
            if (race == null || race.baseRaceRecipe == null) continue;

            // baseRaceRecipe を UMATextRecipe にキャスト
            if (race.baseRaceRecipe is UMATextRecipe baseRecipe)
            {
                // recipeString (JSON文字列) が空でなければファイルに保存
                if (!string.IsNullOrEmpty(baseRecipe.recipeString))
                {
                    string fileName = $"{race.raceName}_BaseRecipe.json";
                    File.WriteAllText(Path.Combine(baseRecipeDir, fileName), baseRecipe.recipeString);
                    totalDumped++;
                }
            }
        }
        Log.LogInfo($"  -> Dumped {totalDumped} Base Race Recipes to '{baseRecipeDir}'");
    }

    // ▼▼▼ ここに新しい関数を追加します ▼▼▼
    private void DumpSlotDataAssets(string outputDirectory)
    {
        Log.LogInfo("Dumping all SlotDataAssets...");
        var assetIndexer = UMAAssetIndexer.Instance;
        if (assetIndexer == null)
        {
            Log.LogError("DumpSlotDataAssets: UMAAssetIndexer not found!");
            return;
        }

        // UMAAssetIndexerから全てのSlotDataAssetを取得します
        var allSlots = assetIndexer.GetAllAssets<SlotDataAsset>();

        if (allSlots.Count == 0)
        {
            Log.LogWarning("DumpSlotDataAssets: No SlotDataAsset assets found.");
            return;
        }

        var csv = new StringBuilder();
        csv.AppendLine("SlotName,SlotID,Races,Tags");

        foreach (var slot in allSlots)
        {
            if (slot == null) continue;

            string tags = (slot.tags != null) ? string.Join(";", slot.tags) : "";
            string races = (slot.Races != null) ? string.Join(";", slot.Races) : "";
            var line = string.Format("\"{0}\",\"{1}\",\"{2}\",\"{3}\"",
                slot.name, slot.slotName, races, tags);
            csv.AppendLine(line);
        }

        string filePath = Path.Combine(outputDirectory, "SlotDataAsset_List.csv");
        File.WriteAllText(filePath, csv.ToString());
        Log.LogInfo($"  -> Dumped {allSlots.Count} SlotDataAssets to {filePath}");
    }

private void DumpLocalizationData(string outputDirectory)
{
    Log.LogInfo("Dumping all Localization data...");

    var csv = new StringBuilder();

    // --- ▼▼▼ ここからが、新しい、より確実なロジックです ▼▼▼ ---

    // 1. 処理対象となる辞書のリストを手動で作成します
    //    (C# 9.0のタプルを使い、ソース名とデータ本体をペアにします)
    var sourcesToDump = new List<(string SourceName, I2.Loc.LanguageSourceData SourceData)>();

    // a) gameManagerが特別に保持している辞書を追加
    if (gameManager.GM.unitNameLanguageSource != null)
    {
        sourcesToDump.Add(("UnitNameSource", gameManager.GM.unitNameLanguageSource));
    }
    if (gameManager.GM.skillLanguageSource != null)
    {
        sourcesToDump.Add(("SkillSource", gameManager.GM.skillLanguageSource));
    }
    if (gameManager.GM.itemLanguageSource != null)
    {
        sourcesToDump.Add(("ItemSource", gameManager.GM.itemLanguageSource));
    }

    // b) LocalizationManagerが自動で認識したグローバルな辞書も追加
    //    gameManagerが持つ辞書と重複しないようにチェックします
    foreach (var globalSource in I2.Loc.LocalizationManager.Sources)
    {
        if (globalSource != null && !sourcesToDump.Any(s => s.SourceData == globalSource))
        {
            // 自動認識されたソースの名前は、残念ながら直接取得する簡単な方法がないため、
            // "GlobalSource_X" のように、連番を振ります。
            sourcesToDump.Add(($"GlobalSource_{I2.Loc.LocalizationManager.Sources.IndexOf(globalSource)}", globalSource));
        }
    }

    if (sourcesToDump.Count == 0)
    {
        Log.LogError("DumpLocalizationData: No language sources found!");
        return;
    }
    
    // --- 2. 収集した全ての辞書を、一つずつ処理します ---

    // まず、全ての辞書に共通のヘッダーを一度だけ書き込みます
    // (最初の辞書から言語リストを取得してヘッダーを作成)
    var header = new StringBuilder();
    header.Append("Source,Key");
    foreach (var lang in sourcesToDump[0].SourceData.mLanguages)
    {
        header.Append("," + lang.Name);
    }
    csv.AppendLine(header.ToString());

    // 収集した辞書リストをループ処理
    foreach (var (sourceName, sourceData) in sourcesToDump)
    {
        if (sourceData == null || sourceData.mTerms.Count == 0) continue;

        Log.LogInfo($"  -> Processing source: {sourceName}");

        // その辞書に含まれる全ての用語（Term）をループ
        foreach (var term in sourceData.mTerms)
        {
            var line = new StringBuilder();
            // どの辞書から来たかと、キー（プログラム名）を追加
            line.Append($"\"{sourceName}\",\"{term.Term}\"");

            // 全ての言語の翻訳を順番に追加
            for (int i = 0; i < sourceData.mLanguages.Count; i++)
            {
                string translation = term.Languages[i]?.Replace("\"", "\"\"") ?? "";
                line.Append($",\"{translation}\"");
            }
            csv.AppendLine(line.ToString());
        }
    }
    
    // --- ▲▲▲ 修正ロジックここまで ▲▲▲ ---

    string filePath = Path.Combine(outputDirectory, "Localization_List.csv");
    File.WriteAllText(filePath, csv.ToString(), Encoding.UTF8);
    Log.LogInfo($"  -> Dumped Localization data from {sourcesToDump.Count} sources to {filePath}");
}

}