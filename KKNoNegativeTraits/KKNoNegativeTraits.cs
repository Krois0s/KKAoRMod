using BepInEx;
using BepInEx.Logging;
using BepInEx.Configuration;
using HarmonyLib;
using DuloGames.UI;
using System.Collections.Generic; 
using System.Linq; 

internal static class ModInfo
{
    internal const string Guid = "kk.aor.nonegativetraits";
    internal const string Name = "KK No Negative Traits";
    internal const string Version = "1.0.0";
}

[BepInPlugin(ModInfo.Guid, ModInfo.Name, ModInfo.Version)]
public class NoNegativeTraitsMod : BaseUnityPlugin
{
    internal static ManualLogSource Log;
    private readonly Harmony harmony = new Harmony(ModInfo.Guid);

    // 設定値を保持するための変数
    public static ConfigEntry<string> BlockedTraitNames;
    
    // パッチ側から高速にアクセスするための、変換済みリスト
    private static List<string> blockedTraitsList;

    void Awake()
    {
        Log = Logger;

        // 1. 設定項目を定義します
        BlockedTraitNames = Config.Bind(
            "General",                          // 設定のセクション名
            "BlockedTraitInternalNames",        // 設定項目のキー（名前）
            "Bully,Lofty",                      // デフォルト値
            "A comma-separated list of Trait internal names to block from being acquired. " + 
            "e.g., Bully,Lofty,FearOfTheStrong" // 設定ファイルに書かれる説明文
        );
        
        // 2. 読み込んだ設定文字列を、使いやすいリスト形式に変換します
        //    "Bully,Lofty" -> ["Bully", "Lofty"]
        blockedTraitsList = BlockedTraitNames.Value
            .Split(',')
            .Select(name => name.Trim()) // 前後の空白を削除
            .Where(name => !string.IsNullOrEmpty(name)) // 空の項目を削除
            .ToList();

        Log.LogInfo($"The following traits will be blocked: {string.Join(", ", blockedTraitsList)}");

        harmony.PatchAll();
        Log.LogInfo("No Negative Traits mod has been loaded and patched!");
    }
    
    // パッチ側から、変換済みのリストにアクセスするためのヘルパーメソッド
    public static bool IsTraitBlocked(string traitName)
    {
        return blockedTraitsList.Contains(traitName);
    }
}

[HarmonyPatch(typeof(TalentManager), nameof(TalentManager.AddTrait))]
class TalentManager_AddTrait_Patch
{
    static bool Prefix(UITalentInfo n_trait)
    {
        if (n_trait != null && n_trait.name != null)
        {
            if (NoNegativeTraitsMod.IsTraitBlocked(n_trait.name))
            {
                NoNegativeTraitsMod.Log.LogInfo($"Blocked the acquisition of the '{n_trait.name}' trait based on config.");
                return false;
            }
        }
        return true;
    }
}