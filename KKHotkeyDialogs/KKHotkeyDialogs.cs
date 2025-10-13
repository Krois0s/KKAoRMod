using BepInEx;
using BepInEx.Logging;
using HarmonyLib;
using UnityEngine;
using PixelCrushers.DialogueSystem;
using System.Linq;

internal static class ModInfo
{
    internal const string Guid = "kk.aor.hotkeydialogs";
    internal const string Name = "KK Hotkey Dialogs";
    internal const string Version = "1.1.0";
}

[BepInPlugin(ModInfo.Guid, ModInfo.Name, ModInfo.Version)]
// [BepInDependency("Assembly-CSharp-firstpass", BepInDependency.DependencyFlags.SoftDependency)] // 不要なのでコメントアウトまたは削除
public class KKHotkeyDialogs : BaseUnityPlugin
{
    internal static ManualLogSource Log;
    private readonly Harmony harmony = new Harmony(ModInfo.Guid);

    void Awake()
    {
        Log = Logger;
        harmony.PatchAll();
        Log.LogInfo("Hotkey Dialogs mod has been loaded and patched!");
    }

    void Update()
    {
        // --- 1. 会話中のホットキー処理 ---
        // 会話中である場合のみ、キー入力を処理する
        if (DialogueManager.IsConversationActive && Input.GetKeyDown(KeyCode.Escape))
        {
            var continueButton = DialogueManager.instance.GetComponentInChildren<StandardUIContinueButtonFastForward>(true);
            if (continueButton != null && continueButton.gameObject.activeSelf)
            {
                continueButton.OnFastForward();
                return;
            }

            var menuPanel = DialogueManager.instance.GetComponentInChildren<StandardUIMenuPanel>(true);
            if (menuPanel != null && menuPanel.isOpen)
            {
                var allButtons = (menuPanel.buttons ?? new StandardUIResponseButton[0])
                    .Concat(menuPanel.instantiatedButtons?.Select(go => go.GetComponent<StandardUIResponseButton>()) ?? new StandardUIResponseButton[0]);
                var lastButton = allButtons.LastOrDefault(b => b != null && b.gameObject.activeSelf && b.isClickable);
                if (lastButton != null)
                {
                    lastButton.OnClick();
                }
            }
        }

        // --- 2. アイテム分割ウィンドウのホットキー処理 ---
        // Eキーが押された瞬間を検知
        if (Input.GetKeyDown(KeyCode.E))
        {
            // キーが押されたフレームでのみ、ItemSpliterを探す（高コストな処理なのでキー入力後に行う）
            var itemSpliter = FindObjectOfType<ItemSpliter>();

            // ItemSpliterが見つかり、かつ表示中であれば
            if (itemSpliter != null && itemSpliter.gameObject.activeInHierarchy)
            {
                // 確認処理を直接呼び出す
                itemSpliter.FinishSplit();
                return;
            }

            // キーが押されたフレームでのみ、LootManagerを探す
            var lootManager = FindObjectOfType<LootManager>();

            // LootManagerが見つかり、かつ表示中であれば
            if (lootManager != null && lootManager.gameObject.activeInHierarchy)
            {
                // "すべて入手" 処理を直接呼び出す
                lootManager.TakeAll();
                return;
            }
        }
    }
}

// ★★★ GameController.Updateにパッチを当て、ESCキーの処理だけを無効化する ★★★
[HarmonyPatch(typeof(GameController), "Update")]
class GameController_Update_Final_Patch
{
    // GameController.Updateの「前」に割り込む
    static bool Prefix()
    {
        // もし会話中で、かつ、ESCキーが押された「まさにそのフレーム」であれば...
        if (DialogueManager.IsConversationActive && HotKey.GetKeyUpIgnoreDisable(HotKey.menu))
        {
            // 本来ならここでメニューが開かれるはずだが、
            // 何もせず、元のUpdateメソッドの実行もキャンセルする
            return false;
        }

        // 上記の条件以外（ESCが押されていない、会話中でない）の場合は、
        // 元のUpdateメソッドを通常通り実行させる（スペースキーの処理などがここに含まれる）
        return true;
    }
}