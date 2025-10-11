using BepInEx;
using BepInEx.Logging;
using BepInEx.Configuration; 
using HarmonyLib;
using UnityEngine;
using UnityEngine.UI; // UIコンポーネント(Button, Imageなど)を使うために必要
using System.IO;     // ファイル読み込み(File.ReadAllBytes)のために必要

internal static class ModInfo
{
    internal const string Guid = "kk.aor.caravancargoaccess";
    internal const string Name = "KK Caravan Cargo Access";
    internal const string Version = "1.0.1";
}

[BepInPlugin(ModInfo.Guid, ModInfo.Name, ModInfo.Version)]
public class KKCaravanCargoAccess : BaseUnityPlugin
{
    internal static ManualLogSource Log;
    private readonly Harmony harmony = new Harmony(ModInfo.Guid);
    
    internal static Sprite caravanButtonSprite;
    internal static Button myCaravanButton;

    public static ConfigEntry<bool> RestrictToTowns;

    void Awake()
    {
        Log = Logger;

        // ★★★ コンフィグ定義を修正 ★★★
        RestrictToTowns = Config.Bind(
            "General",
            "RestrictToTowns", // キー名を変更
            true,              // デフォルト値を true に変更
            "If true, the button is only visible in towns. If false, it is visible everywhere except the world map."
        );
        Log.LogInfo($"RestrictToTowns set to: {RestrictToTowns.Value}");

        // MODのDLLがあるフォルダのパスを取得します
        string modDirectory = Path.GetDirectoryName(Info.Location);
        
        // 読み込みたいアセットバンドルファイルのフルパスを構築します
        string bundlePath = Path.Combine(modDirectory, "warehouseicon");
        
        Log.LogInfo($"Attempting to load AssetBundle from: {bundlePath}");

        // 3. ファイルが存在するか確認します
        if (File.Exists(bundlePath))
        {
            try
            {
                // アセットバンドルファイルをメモリにロードします
                AssetBundle assetBundle = AssetBundle.LoadFromFile(bundlePath);

                if (assetBundle != null)
                {
                    // バンドルの中から、元となったアセット名でスプライトをロードします
                    caravanButtonSprite = assetBundle.LoadAsset<Sprite>("WarehouseIcon");
                    
                    if (caravanButtonSprite != null)
                    {
                        Log.LogInfo("Successfully loaded sprite from the AssetBundle!");
                    }
                    else
                    {
                        Log.LogError("AssetBundle loaded, but could not find 'WarehouseIcon' sprite inside. Check the asset name.");
                    }

                }
                else
                {
                    Log.LogError("Failed to load the AssetBundle. The file might be corrupted.");
                }
            }
            catch (System.Exception e)
            {
                Log.LogError($"An error occurred while loading the AssetBundle: {e}");
            }
        }
        else
        {
            Log.LogError("AssetBundle 'warehouseicon' not found in the mod directory!");
        }

        // Harmonyパッチを適用します
        harmony.PatchAll();
        
        Log.LogInfo("Caravan Cargo Access mod has been loaded and patched!");
    }

    void Update()
    {
        if (myCaravanButton != null)
        {
            // ★★★ 解放済みチェックを追加 ★★★
            bool caravanUnlocked = CaravanUIManager.Instance != null && CaravanUIManager.Instance.HasCaravan;

            bool isTown = CityTownManager.instance != null;
            bool isWorldMap = WorldTravelManager.instance != null;
            bool canBeVisible;

            if (RestrictToTowns.Value == true)
            {
                canBeVisible = isTown;
            }
            else
            {
                canBeVisible = !isWorldMap;
            }
            
            bool isWarehouseOpen = WarehouseManager.instance != null && WarehouseManager.instance.opening;

            // ★★★ 最終的な表示条件に「解放済み」を追加 ★★★
            bool shouldBeActive = caravanUnlocked && canBeVisible && !isWarehouseOpen;

            if (myCaravanButton.gameObject.activeSelf != shouldBeActive)
            {
                myCaravanButton.gameObject.SetActive(shouldBeActive);
            }
        }
    }
}

// プレイヤーインベントリUIが準備されたタイミングを狙う
[HarmonyPatch(typeof(InventoryManager), "Start")]
class InventoryManager_Start_Patch
{
    static void Postfix(InventoryManager __instance)
    {
        KKCaravanCargoAccess.Log.LogInfo("InventoryManager.Start() has finished. Creating caravan button...");

        try
        {
            if (KKCaravanCargoAccess.myCaravanButton != null) return;

            // --- ボタン生成のメインロジック ---
            GameObject buttonObj = new GameObject("KKCaravanButton");
            buttonObj.transform.SetParent(__instance.transform, false);

            Image buttonImage = buttonObj.AddComponent<Image>();
            buttonImage.sprite = KKCaravanCargoAccess.caravanButtonSprite;
            // ★★★ 画像のアスペクト比を維持する設定を追加 ★★★
            buttonImage.preserveAspect = true;

            Button button = buttonObj.AddComponent<Button>();
            button.onClick.AddListener(() => {
                if (WarehouseManager.instance != null)
                {
                    WarehouseManager.instance.OpenWarehouse("Caravan");
                }
            });

            // ★★★ レイアウトグループの影響を制御する設定を追加 ★★★
            LayoutElement layoutElement = buttonObj.AddComponent<LayoutElement>();
            layoutElement.ignoreLayout = true; // レイアウトグループの制御を完全に無視する

            // --- 位置とサイズの調整 ---
            RectTransform rect = buttonObj.GetComponent<RectTransform>();
            rect.anchorMin = new Vector2(1, 1);
            rect.anchorMax = new Vector2(1, 1);
            rect.pivot = new Vector2(1, 1);
            
            rect.anchoredPosition = new Vector2(-120, -46); // ボタン位置
            rect.sizeDelta = new Vector2(59, 59);      // サイズを変更
            
            KKCaravanCargoAccess.myCaravanButton = button;
            KKCaravanCargoAccess.Log.LogInfo("Caravan button created successfully!");
        }
        catch (System.Exception e)
        {
            KKCaravanCargoAccess.Log.LogError($"An error occurred while creating the caravan button: {e}");
        }
    }
}