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

internal static class ModInfo
{
    internal const string Guid = "kk.aor.datadumper";
    internal const string Name = "KK Data Dumper";
    internal const string Version = "1.0.0";
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
            DumpLocalizationData(versionFolderPath);

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
        csv.AppendLine("SourceList,AttributeType,Value,LevelAlter");

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
                var line = string.Format("\"{0}\",{1},{2},{3}", sourceName, attr.type, attr.value, attr.levelAlter);
                csv.AppendLine(line);
            }
        }

        string filePath = Path.Combine(outputDirectory, "AddonAttribute_List.csv");
        File.WriteAllText(filePath, csv.ToString());
        Log.LogInfo($"  -> Dumped AddonAttributes to {filePath}");
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
        csv.AppendLine("ID,BuffType,Description");

        foreach (var buffInfo in UIBuffDatabase.Instance.buffs)
        {
            if (buffInfo == null) continue;

            // string.Formatから "buffInfo.Name" を削除
            var line = string.Format("\"{0}\",{1},\"{2}\"",
                buffInfo.id, // .id がプログラム名（ID）です
                buffInfo.type,
                buffInfo.description.Replace("\"", "\"\""));
            csv.AppendLine(line);
        }

        string filePath = Path.Combine(outputDirectory, "Buff_List.csv");
        File.WriteAllText(filePath, csv.ToString());
        Log.LogInfo($"  -> Dumped {UIBuffDatabase.Instance.buffs.Length} Buffs to {filePath}");
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