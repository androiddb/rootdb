#!/usr/bin/env python3
"""Build RootDB seed SQL from a structured catalog. Emits 3 ordered files:
  0002a_seed_base.sql      — curator user + devices + rootability + variants + universal methods
  0002b_seed_catalog.sql   — roms + tools + software
  0002c_seed_content.sql   — guides (blocks) + sample Q&A + issues
Uses jsonb_to_recordset so all quoting is handled by json.dumps.
Idempotent on slug-keyed tables (devices, software, device_rootability); run roms/tools once.
"""
import json, pathlib

BASE = pathlib.Path(__file__).resolve().parent.parent / "db" / "migrations"

# ---------------------------------------------------------------- devices
DEVICES = [
  dict(slug="google-pixel-9-pro-xl", brand="Google", name="Pixel 9 Pro XL", model="GGX8B", codename="komodo", year=2024, android=["14","15","16"], soc="Tensor G4", ram=["16GB"], pop=78,
       verdict="rootable", bootloader="official", unlock="fastboot flashing unlock", unlock_url="https://developers.google.com/android/images",
       notes="Verizon-sold units (GE2AE) have OEM unlocking permanently disabled — buy factory-unlocked. On Android 14+ patch init_boot, not boot."),
  dict(slug="google-pixel-9", brand="Google", name="Pixel 9", model="G2YBB", codename="tokay", year=2024, android=["14","15","16"], soc="Tensor G4", ram=["12GB"], pop=75,
       verdict="rootable", bootloader="official", unlock="fastboot flashing unlock", unlock_url="https://developers.google.com/android/images"),
  dict(slug="google-pixel-8-pro", brand="Google", name="Pixel 8 Pro", model="GC3VE", codename="husky", year=2023, android=["14","15","16"], soc="Tensor G3", ram=["12GB"], pop=80,
       verdict="rootable", bootloader="official", unlock="fastboot flashing unlock", unlock_url="https://developers.google.com/android/images",
       notes="Verizon/cross-carrier US model G1MNW cannot be unlocked."),
  dict(slug="google-pixel-8", brand="Google", name="Pixel 8", model="GKWS6", codename="shiba", year=2023, android=["14","15","16"], soc="Tensor G3", ram=["8GB"], pop=72,
       verdict="rootable", bootloader="official", unlock="fastboot flashing unlock", unlock_url="https://developers.google.com/android/images"),
  dict(slug="google-pixel-8a", brand="Google", name="Pixel 8a", model="GKV4X", codename="akita", year=2024, android=["14","15","16"], soc="Tensor G3", ram=["8GB"], pop=60,
       verdict="rootable", bootloader="official", unlock="fastboot flashing unlock", unlock_url="https://developers.google.com/android/images"),
  dict(slug="google-pixel-7-pro", brand="Google", name="Pixel 7 Pro", model="GP4BC", codename="cheetah", year=2022, android=["13","14","15"], soc="Tensor G2", ram=["12GB"], pop=85,
       verdict="rootable", bootloader="official", unlock="fastboot flashing unlock", unlock_url="https://developers.google.com/android/images",
       notes="Verizon variant GFE4J has a permanently locked bootloader. KernelSU and Magisk both first-class here; huge custom ROM scene."),
  dict(slug="google-pixel-7", brand="Google", name="Pixel 7", model="GVU6C", codename="panther", year=2022, android=["13","14","15"], soc="Tensor G2", ram=["8GB"], pop=74,
       verdict="rootable", bootloader="official", unlock="fastboot flashing unlock", unlock_url="https://developers.google.com/android/images"),
  dict(slug="google-pixel-7a", brand="Google", name="Pixel 7a", model="GHL1X", codename="lynx", year=2023, android=["13","14","15","16"], soc="Tensor G2", ram=["8GB"], pop=66,
       verdict="rootable", bootloader="official", unlock="fastboot flashing unlock", unlock_url="https://developers.google.com/android/images"),
  dict(slug="google-pixel-6-pro", brand="Google", name="Pixel 6 Pro", model="GLUOG", codename="raven", year=2021, android=["12","13","14","15"], soc="Tensor G1", ram=["12GB"], pop=70, ar=True,
       verdict="rootable", bootloader="official", unlock="fastboot flashing unlock", unlock_url="https://developers.google.com/android/images",
       notes="Anti-rollback since mid-2022 builds. Keep a matching full OTA on hand; prefer dirty-flash OTA + 'install to inactive slot'."),
  dict(slug="google-pixel-6", brand="Google", name="Pixel 6", model="GB7N6", codename="oriole", year=2021, android=["12","13","14","15"], soc="Tensor G1", ram=["8GB"], pop=72, ar=True,
       verdict="rootable", bootloader="official", unlock="fastboot flashing unlock", unlock_url="https://developers.google.com/android/images",
       notes="Same GB7N6 model number ships unlocked and Verizon-locked — check OEM unlocking before paying."),
  dict(slug="google-pixel-6a", brand="Google", name="Pixel 6a", model="GX7AS", codename="bluejay", year=2022, android=["12","13","14","15"], soc="Tensor G1", ram=["6GB"], pop=58, ar=True,
       verdict="rootable", bootloader="official", unlock="fastboot flashing unlock", unlock_url="https://developers.google.com/android/images"),
  dict(slug="google-pixel-5", brand="Google", name="Pixel 5", model="GD1YQ", codename="redfin", year=2020, android=["11","12","13","14"], soc="Snapdragon 765G", ram=["8GB"], pop=55,
       verdict="rootable", bootloader="official", unlock="fastboot flashing unlock", unlock_url="https://developers.google.com/android/images"),
  dict(slug="google-pixel-4a", brand="Google", name="Pixel 4a", model="G025J", codename="sunfish", year=2020, android=["11","12","13"], soc="Snapdragon 730G", ram=["6GB"], pop=48,
       verdict="rootable", bootloader="official", unlock="fastboot flashing unlock", unlock_url="https://developers.google.com/android/images"),
  dict(slug="google-pixel-4-xl", brand="Google", name="Pixel 4 XL", model="G020J", codename="coral", year=2019, android=["10","11","12","13"], soc="Snapdragon 855", ram=["6GB"], pop=45,
       verdict="rootable", bootloader="official", unlock="fastboot flashing unlock", unlock_url="https://developers.google.com/android/images"),
  dict(slug="google-pixel-3-xl", brand="Google", name="Pixel 3 XL", model="G013C", codename="crosshatch", year=2018, android=["9","10","11","12"], soc="Snapdragon 845", ram=["4GB"], pop=40,
       verdict="rootable", bootloader="official", unlock="fastboot flashing unlock", unlock_url="https://developers.google.com/android/images"),
  dict(slug="google-pixel-fold", brand="Google", name="Pixel Fold", model="G9FPL", codename="felix", year=2023, android=["13","14","15","16"], soc="Tensor G2", ram=["12GB"], pop=52,
       verdict="rootable", bootloader="official", unlock="fastboot flashing unlock", unlock_url="https://developers.google.com/android/images",
       notes="Verizon-sold units locked. Back up before OTAs — rooted hinge-device A/B updates can be fussy."),
  dict(slug="google-nexus-6p", brand="Google / Huawei", name="Nexus 6P", model="H1511", codename="angler", year=2015, android=["8.1"], soc="Snapdragon 810", ram=["3GB"], pop=35,
       verdict="rootable", bootloader="official", unlock="fastboot oem unlock",
       notes="Bootloop-prone on stock — community 4-core kernel configs are the classic fix. Still a LineageOS testbed."),
  dict(slug="google-nexus-5", brand="Google / LG", name="Nexus 5", model="D820", codename="hammerhead", year=2013, android=["6.0.1"], soc="Snapdragon 800", ram=["2GB"], pop=30,
       verdict="rootable", bootloader="official", unlock="fastboot oem unlock",
       notes="Spiritual ancestor of the custom-ROM scene; MultiROM was made for this."),
]

KNOX = ["Knox is permanently tripped on unlock — Samsung Pay/Pass/Health and warranty are gone forever."]
# ---- Samsung ----
DEVICES += [
  dict(slug="samsung-galaxy-s24", brand="Samsung", name="Galaxy S24", model="SM-S921", codename="e1s", aliases=["Galaxy S24 5G"], year=2024, android=["14","15","16"], soc="Snapdragon 8 Gen 3 / Exynos 2400", ram=["8GB"], pop=70,
       verdict="partially", bootloader="limited", warnings=KNOX,
       notes="US/Canada Snapdragon variants ship permanently locked. International Exynos unlocks via OEM unlocking + download mode."),
  dict(slug="samsung-galaxy-s23-ultra", brand="Samsung", name="Galaxy S23 Ultra", model="SM-S918", codename="dm3q", year=2023, android=["13","14","15","16"], soc="Snapdragon 8 Gen 2 for Galaxy", ram=["8GB","12GB"], pop=68,
       verdict="partially", bootloader="limited", warnings=KNOX,
       notes="All S23s are Snapdragon worldwide, but US/CA models (SM-S918U/U1/W) are permanently locked. International SM-S918B unlocks fine."),
  dict(slug="samsung-galaxy-s23", brand="Samsung", name="Galaxy S23", model="SM-S911", codename="dm1q", year=2023, android=["13","14","15","16"], soc="Snapdragon 8 Gen 2 for Galaxy", ram=["8GB"], pop=72,
       verdict="partially", bootloader="limited", warnings=KNOX,
       notes="A Verizon S23 (SM-S911U) cannot be modded — bootloader permanently locked. An international SM-S911B roots cleanly."),
  dict(slug="samsung-galaxy-s23-fe", brand="Samsung", name="Galaxy S23 FE", model="SM-S711", codename="r11q", year=2023, android=["13","14","15"], soc="Snapdragon 8 Gen 1 / Exynos 2200", ram=["8GB"], pop=50,
       verdict="partially", bootloader="limited", warnings=KNOX,
       notes="Region dependent; US models locked. Avoid RMM-state: keep network connected on first boot after unlock."),
  dict(slug="samsung-galaxy-s22", brand="Samsung", name="Galaxy S22", model="SM-S901", codename="r0s", year=2022, android=["12","13","14","15"], soc="Snapdragon 8 Gen 1 / Exynos 2200", ram=["8GB"], pop=62,
       verdict="partially", bootloader="limited", warnings=KNOX,
       notes="US Snapdragon locked; international Exynos unlocks. Watch the 7-day RMM prenormal window."),
  dict(slug="samsung-galaxy-s21", brand="Samsung", name="Galaxy S21", model="SM-G991", codename="o1s", year=2021, android=["11","12","13","14","15"], soc="Snapdragon 888 / Exynos 2100", ram=["8GB"], pop=58,
       verdict="partially", bootloader="limited", warnings=KNOX,
       notes="US Snapdragon locked; international Exynos unlockable."),
  dict(slug="samsung-galaxy-s20", brand="Samsung", name="Galaxy S20", model="SM-G980", codename="x1s", year=2020, android=["10","11","12","13"], soc="Snapdragon 865 / Exynos 990", ram=["8GB","12GB"], pop=52,
       verdict="partially", bootloader="limited", warnings=KNOX,
       notes="US Snapdragon locked; international Exynos unlocks and has a healthy LineageOS scene."),
  dict(slug="samsung-galaxy-s10", brand="Samsung", name="Galaxy S10", model="SM-G973", codename="beyond1", year=2019, android=["9","10","11","12"], soc="Snapdragon 855 / Exynos 9820", ram=["8GB"], pop=55,
       verdict="partially", bootloader="limited", warnings=KNOX,
       notes="US Snapdragon locked; international Exynos roots well — a ROM-scene favorite."),
  dict(slug="samsung-galaxy-note-10-plus", brand="Samsung", name="Galaxy Note 10+", model="SM-N975", codename="d2s", aliases=["Note 10 Plus"], year=2019, android=["9","10","11","12"], soc="Snapdragon 855 / Exynos 9825", ram=["12GB"], pop=50,
       verdict="partially", bootloader="limited", warnings=KNOX,
       notes="US Snapdragon locked; international Exynos unlockable."),
  dict(slug="samsung-galaxy-a54", brand="Samsung", name="Galaxy A54", model="SM-A546", codename="a54x", year=2023, android=["13","14","15","16"], soc="Exynos 1380", ram=["6GB","8GB"], pop=45,
       verdict="partially", bootloader="limited", warnings=KNOX,
       notes="Global Exynos model unlocks in download mode; root works, but almost no custom ROMs exist."),
  dict(slug="samsung-galaxy-z-fold-4", brand="Samsung", name="Galaxy Z Fold 4", model="SM-F936", codename="q4q", year=2022, android=["12","13","14","15","16"], soc="Snapdragon 8+ Gen 1", ram=["12GB"], pop=48,
       verdict="partially", bootloader="limited", warnings=KNOX,
       notes="US units locked; international F936B unlockable. Mostly root-and-tweak, few ROMs."),
  dict(slug="samsung-galaxy-s2", brand="Samsung", name="Galaxy S II", model="GT-I9100", codename="i9100", aliases=["Galaxy S2"], year=2011, android=["4.1.2"], soc="Exynos 4210", ram=["1GB"], pop=25,
       verdict="rootable", bootloader="official", unlock="Odin flash (no bootloader lock exists)",
       notes="Still boots Android 11 GSI builds with isorec TWRP in 2026. Pure nostalgia hardware."),
  # ---- OnePlus ----
  dict(slug="oneplus-12", brand="OnePlus", name="OnePlus 12", model="CPH2581", codename="waffle", year=2024, android=["14","15","16"], soc="Snapdragon 8 Gen 3", ram=["12GB","16GB"], pop=65,
       verdict="rootable", bootloader="official", unlock="fastboot oem unlock (enable OEM unlocking first)",
       notes="Fewer ROMs post-ColorOS merge, but root tooling is fully back. Use the local-install OTA flow to keep root across updates."),
  dict(slug="oneplus-11", brand="OnePlus", name="OnePlus 11", model="CPH2449", codename="salami", year=2023, android=["13","14","15","16"], soc="Snapdragon 8 Gen 2", ram=["8GB","16GB"], pop=62,
       verdict="rootable", bootloader="official", unlock="fastboot oem unlock (enable OEM unlocking first)"),
  dict(slug="oneplus-10-pro", brand="OnePlus", name="OnePlus 10 Pro", model="NE2213", codename="negroni", aliases=["OP10 Pro"], year=2022, android=["12","13","14","15"], soc="Snapdragon 8 Gen 1", ram=["8GB","12GB"], pop=54,
       verdict="rootable", bootloader="official", unlock="fastboot oem unlock (enable OEM unlocking first)",
       notes="T-Mobile variant (NE2217) requires SIM unlock plus a OnePlus unlock token."),
  dict(slug="oneplus-9-pro", brand="OnePlus", name="OnePlus 9 Pro", model="LE2123", codename="lemonadep", year=2021, android=["11","12","13","14"], soc="Snapdragon 888", ram=["8GB","12GB"], pop=60,
       verdict="rootable", bootloader="official", unlock="fastboot oem unlock (enable OEM unlocking first)"),
  dict(slug="oneplus-8-pro", brand="OnePlus", name="OnePlus 8 Pro", model="IN2023", codename="instantnoodle", year=2020, android=["10","11","12","13"], soc="Snapdragon 865", ram=["8GB","12GB"], pop=58,
       verdict="rootable", bootloader="official", unlock="fastboot oem unlock (enable OEM unlocking first)",
       notes="MSM Download Tool makes this nearly unbrickable."),
  dict(slug="oneplus-7-pro", brand="OnePlus", name="OnePlus 7 Pro", model="GM1917", codename="guacamole", aliases=["OP7 Pro"], year=2019, android=["9","10","11","12"], soc="Snapdragon 855", ram=["6GB","8GB","12GB"], pop=68,
       verdict="rootable", bootloader="official", unlock="fastboot oem unlock (enable OEM unlocking first)",
       notes="The all-timer. 90 Hz notch-free display plus massive ROM support: LineageOS official, crDroid, OmniROM."),
  dict(slug="oneplus-6t", brand="OnePlus", name="OnePlus 6T", model="A6013", codename="fajita", year=2018, android=["9","10","11"], soc="Snapdragon 845", ram=["6GB","8GB"], pop=55,
       verdict="rootable", bootloader="official", unlock="fastboot oem unlock (enable OEM unlocking first)"),
  dict(slug="oneplus-nord", brand="OnePlus", name="OnePlus Nord", model="AC2003", codename="avicii", year=2020, android=["10","11","12"], soc="Snapdragon 765G", ram=["8GB","12GB"], pop=45,
       verdict="rootable", bootloader="official", unlock="fastboot oem unlock (enable OEM unlocking first)"),
  dict(slug="oneplus-one", brand="OnePlus", name="OnePlus One", model="A0001", codename="bacon", aliases=["OPO"], year=2014, android=["6.0.1 (CM13)"], soc="Snapdragon 801", ram=["3GB"], pop=35,
       verdict="rootable", bootloader="official", unlock="fastboot oem unlock",
       notes="Where a generation of flashers started. Unofficial LineageOS 18.1 builds still exist."),
  dict(slug="oneplus-3t", brand="OnePlus", name="OnePlus 3T", model="A3010", codename="oneplus3t", aliases=["OP3T"], year=2016, android=["9 (stock); beyond via community builds"], soc="Snapdragon 821", ram=["6GB"], pop=40,
       verdict="rootable", bootloader="official", unlock="fastboot oem unlock"),
  # ---- Xiaomi ----
  dict(slug="xiaomi-poco-f3", brand="Xiaomi", name="POCO F3", model="M2012K11AG", codename="alioth", aliases=["Redmi K40","Mi 11X"], year=2021, android=["11","12","13","14"], soc="Snapdragon 870", ram=["6GB","8GB"], pop=75,
       verdict="rootable", bootloader="official", unlock="Mi Unlock tool", unlock_url="https://en.miui.com/unlock/", wait=168,
       notes="One phone, three names — identical hardware worldwide; standard builds flash across all labels. Arguably the best value ROM phone ever made."),
  dict(slug="xiaomi-poco-f5", brand="Xiaomi", name="POCO F5", model="23049PCD8G", codename="marble", aliases=["Redmi Note 12 Turbo"], year=2023, android=["13","14","15"], soc="Snapdragon 7+ Gen 2", ram=["8GB","12GB"], pop=60,
       verdict="rootable", bootloader="official", unlock="Mi Unlock tool", unlock_url="https://en.miui.com/unlock/", wait=168),
  dict(slug="xiaomi-poco-x3-pro", brand="Xiaomi", name="POCO X3 Pro", model="M2102J20SG", codename="vayu", year=2021, android=["11","12","13","14"], soc="Snapdragon 860", ram=["6GB","8GB"], pop=55, ar=True,
       verdict="rootable", bootloader="official", unlock="Mi Unlock tool", unlock_url="https://en.miui.com/unlock/", wait=168,
       notes="Anti-rollback active: never flash a lower-ARB MIUI build — instant hard brick outside authorized EDL."),
  dict(slug="xiaomi-13", brand="Xiaomi", name="Xiaomi 13", model="2211133G", codename="fuxi", year=2023, android=["13","14","15"], soc="Snapdragon 8 Gen 2", ram=["8GB","12GB"], pop=55,
       verdict="rootable", bootloader="official", unlock="Mi Unlock tool", unlock_url="https://en.miui.com/unlock/", wait=168),
  dict(slug="xiaomi-mi-11", brand="Xiaomi", name="Mi 11", model="M2011K2G", codename="venus", year=2021, android=["11","12","13","14"], soc="Snapdragon 888", ram=["8GB","12GB"], pop=50, ar=True,
       verdict="rootable", bootloader="official", unlock="Mi Unlock tool", unlock_url="https://en.miui.com/unlock/", wait=168),
  dict(slug="xiaomi-mi-9", brand="Xiaomi", name="Mi 9", model="M1902F1G", codename="cepheus", year=2019, android=["9","10","11"], soc="Snapdragon 855", ram=["6GB","8GB"], pop=50,
       verdict="rootable", bootloader="official", unlock="Mi Unlock tool", unlock_url="https://en.miui.com/unlock/", wait=168),
  dict(slug="xiaomi-redmi-note-10-pro", brand="Xiaomi", name="Redmi Note 10 Pro", model="M2101K6G", codename="sweet", year=2021, android=["11","12","13"], soc="Snapdragon 732G", ram=["6GB","8GB"], pop=52,
       verdict="rootable", bootloader="official", unlock="Mi Unlock tool", unlock_url="https://en.miui.com/unlock/", wait=168),
  dict(slug="xiaomi-redmi-note-8", brand="Xiaomi", name="Redmi Note 8", model="M1908C3XG", codename="ginkgo", year=2019, android=["9","10","11"], soc="Snapdragon 665", ram=["4GB","6GB"], pop=50,
       verdict="rootable", bootloader="official", unlock="Mi Unlock tool", unlock_url="https://en.miui.com/unlock/", wait=168),
  dict(slug="xiaomi-redmi-k20-pro", brand="Xiaomi", name="Redmi K20 Pro", model="M1903F11G", codename="raphael", aliases=["Mi 9T Pro"], year=2019, android=["9","10","11"], soc="Snapdragon 855", ram=["6GB","8GB"], pop=55,
       verdict="rootable", bootloader="official", unlock="Mi Unlock tool", unlock_url="https://en.miui.com/unlock/", wait=168,
       notes="Pop-up camera, flagship silicon, huge ROM scene. A community legend."),
  # ---- Nothing ----
  dict(slug="nothing-phone-1", brand="Nothing", name="Nothing Phone (1)", model="A063", codename="spacewar", aliases=["Phone 1"], year=2022, android=["12","13","14","15"], soc="Snapdragon 778G+", ram=["8GB","12GB"], pop=65,
       verdict="rootable", bootloader="official", unlock="fastboot flashing unlock",
       notes="Nothing publishes kernel sources quickly; KernelSU works out of the box."),
  dict(slug="nothing-phone-2", brand="Nothing", name="Nothing Phone (2)", model="A065", codename="pong", aliases=["Phone 2"], year=2023, android=["13","14","15","16"], soc="Snapdragon 8+ Gen 1", ram=["8GB","12GB"], pop=62,
       verdict="rootable", bootloader="official", unlock="fastboot flashing unlock"),
  dict(slug="nothing-phone-2a", brand="Nothing", name="Nothing Phone (2a)", model="A142", codename="pacman", aliases=["Phone 2a"], year=2024, android=["14","15","16"], soc="Dimensity 7200 Pro", ram=["8GB","12GB"], pop=55,
       verdict="rootable", bootloader="official", unlock="fastboot flashing unlock",
       notes="MediaTek chip, but Nothing ships full fastboot and kernel sources — root path is clean."),
  # ---- Others ----
  dict(slug="motorola-edge-40-pro", brand="Motorola", name="Motorola Edge 40 Pro", model="XT2301-4", codename="rtwo", aliases=["Moto X40","Edge+ (2023)"], year=2023, android=["13","14","15"], soc="Snapdragon 8 Gen 2", ram=["12GB"], pop=45,
       verdict="rootable", bootloader="official", unlock="Motorola unlock portal (get_unlock_data)", unlock_url="https://motorola-global-portal.custhelp.com/app/standalone/bootloader/unlock-your-device-a",
       notes="US Edge+ (2023) is the same hardware. Portal unlocks within minutes, not days."),
  dict(slug="motorola-moto-g7-power", brand="Motorola", name="Moto G7 Power", model="XT1955", codename="ocean", year=2019, android=["9","10"], soc="Snapdragon 632", ram=["3GB","4GB"], pop=35,
       verdict="partially", bootloader="official", unlock="Motorola unlock portal",
       notes="Retail-unlocked units only; carrier-branded SKUs can't get unlock codes."),
  dict(slug="sony-xperia-1-v", brand="Sony", name="Xperia 1 V", model="XQ-DQ72", codename="pdx234", aliases=["Xperia 1 Mk5"], year=2023, android=["13","14","15"], soc="Snapdragon 8 Gen 2", ram=["12GB"], pop=42,
       verdict="rootable", bootloader="official", unlock="Sony Open Devices unlock page (IMEI code)", unlock_url="https://developer.sony.com/open-source/aosp-on-xperia-open-devices",
       warnings=["Back up the TA partition (DRM keys) with newflasher before unlock or camera processing degrades permanently."],
       notes="Sony's Open Devices program is exemplary: official unlock plus AOSP device trees."),
  dict(slug="sony-xperia-5-iv", brand="Sony", name="Xperia 5 IV", model="XQ-CQ72", codename="pdx224", aliases=["Xperia 5 Mk4"], year=2022, android=["12","13","14"], soc="Snapdragon 8 Gen 1", ram=["8GB"], pop=38,
       verdict="rootable", bootloader="official", unlock="Sony Open Devices unlock page (IMEI code)", unlock_url="https://developer.sony.com/open-source/aosp-on-xperia-open-devices",
       warnings=["Back up the TA partition (DRM keys) with newflasher before unlock."]),
  dict(slug="asus-rog-phone-6", brand="ASUS", name="ROG Phone 6", model="AI2201", codename="ai2201", aliases=["ROG 6"], year=2022, android=["12","13","14"], soc="Snapdragon 8+ Gen 1", ram=["12GB","16GB"], pop=45,
       verdict="rootable", bootloader="official", unlock="ASUS official Unlock App (APK)",
       notes="The unlock app voids warranty per ASUS policy and can disable OTAs — snapshot a full backup first."),
  dict(slug="asus-zenfone-9", brand="ASUS", name="Zenfone 9", model="AI2202", codename="ai2202", year=2022, android=["12","13","14"], soc="Snapdragon 8+ Gen 1", ram=["8GB","16GB"], pop=50,
       verdict="rootable", bootloader="official", unlock="ASUS official Unlock App (APK)",
       notes="Small, fast, unlockable, LineageOS official — a rare combo in 2026."),
  dict(slug="fairphone-5", brand="Fairphone", name="Fairphone 5", model="FP5", codename="fp5", year=2023, android=["13","14","15"], soc="Snapdragon QCM6490", ram=["8GB"], pop=40,
       verdict="rootable", bootloader="official", unlock="fastboot (code from Fairphone portal)", unlock_url="https://support.fairphone.com/",
       notes="/e/OS and iodéOS are flagship experiences here; long-term support focus."),
  dict(slug="fairphone-4", brand="Fairphone", name="Fairphone 4", model="FP4", codename="fp4", year=2021, android=["11","12","13","14"], soc="Snapdragon 750G", ram=["6GB","8GB"], pop=38,
       verdict="rootable", bootloader="official", unlock="fastboot (code from Fairphone portal)", unlock_url="https://support.fairphone.com/"),
  dict(slug="essential-phone", brand="Essential", name="Essential Phone (PH-1)", model="PH-1", codename="mata", aliases=["PH-1"], year=2017, android=["10 (stock); 13-14 via ROMs"], soc="Snapdragon 835", ram=["4GB"], pop=35,
       verdict="rootable", bootloader="official", unlock="fastboot flashing unlock + flashing unlock_critical",
       notes="Company is gone, community isn't. Use both unlock commands — missing unlock_critical silently blocks flashes."),
  dict(slug="lg-v20", brand="LG", name="LG V20", model="US996", codename="us996", aliases=["V20"], year=2016, android=["8.0 (stock); 11 via LineageOS"], soc="Snapdragon 820", ram=["4GB"], pop=38,
       verdict="partially", bootloader="limited", unlock="LG official unlock (open-market US996 only)",
       notes="Only US996 unlocks officially. T-Mobile H918 works via DirtySanta-lineage exploits; VS995/H910 have no path."),
  dict(slug="htc-hd2", brand="HTC", name="HTC HD2", model="HD2", codename="leo", aliases=["The immortal HD2"], year=2009, android=["Anything (via MAGLDR/cLK)"], soc="Snapdragon QSD8250", ram=["576MB"], pop=30,
       verdict="rootable", bootloader="official", unlock="HSPL → MAGLDR or cLK (Windows Mobile era)",
       notes="Shipped with Windows Mobile 6.5 in 2009. Community ported Android, Ubuntu Touch, Windows RT and more. Not practical — a monument."),
]

# ---------------------------------------------------------------- variants
def v(label, models, verdict=None, bl=None, notes=None, sort=0):
    return dict(label=label, model_numbers=models, verdict=verdict, bootloader=bl, bootloader_notes=notes, sort_order=sort)

VARIANTS = {
 "samsung-galaxy-s23": [
   v("US / Canada carrier (Snapdragon)", ["SM-S911U","SM-S911U1","SM-S911W"], "not_rootable", "locked",
     "Permanently locked — the OEM unlocking toggle never appears. Includes Verizon/AT&T/T-Mobile and factory U1 units.", 0),
   v("International (B/DS)", ["SM-S911B","SM-S911B/DS"], None, None, "OEM unlocking in dev options, unlock in download mode.", 1),
   v("Hong Kong / Taiwan / China", ["SM-S9110"], None, "limited", "Unlockable but almost no custom ROM support for this baseband build.", 2)],
 "samsung-galaxy-s23-ultra": [
   v("US / Canada carrier (Snapdragon)", ["SM-S918U","SM-S918U1","SM-S918W"], "not_rootable", "locked",
     "Permanently locked on all US/CA models, including factory-unlocked U1.", 0),
   v("International (B/DS)", ["SM-S918B","SM-S918B/DS"], None, None, "Unlockable via OEM unlocking + download mode.", 1)],
 "samsung-galaxy-s24": [
   v("US / Canada (Snapdragon 8 Gen 3)", ["SM-S921U","SM-S921U1","SM-S921W"], "not_rootable", "locked",
     "Permanently locked. No known exploit path — do not buy for modding.", 0),
   v("International (Exynos 2400)", ["SM-S921B","SM-S921B/DS"], None, None, "Unlockable; ROM scene growing, Exynos-specific builds only.", 1)],
 "samsung-galaxy-s22": [
   v("US / Canada (Snapdragon 8 Gen 1)", ["SM-S901U","SM-S901U1","SM-S901W"], "not_rootable", "locked", "Permanently locked.", 0),
   v("International (Exynos 2200)", ["SM-S901B","SM-S901B/DS"], None, None, "Unlockable.", 1)],
 "samsung-galaxy-s21": [
   v("US / Canada (Snapdragon 888)", ["SM-G991U","SM-G991U1","SM-G991W"], "not_rootable", "locked", "Permanently locked.", 0),
   v("International (Exynos 2100)", ["SM-G991B","SM-G991B/DS"], None, None, "Unlockable.", 1)],
 "samsung-galaxy-s20": [
   v("US / Canada (Snapdragon 865)", ["SM-G981U","SM-G981U1","SM-G981W"], "not_rootable", "locked", "Permanently locked.", 0),
   v("International (Exynos 990)", ["SM-G980F/DS","SM-G981B/DS"], None, None, "Unlockable.", 1)],
 "samsung-galaxy-s10": [
   v("US / Canada (Snapdragon 855)", ["SM-G973U","SM-G973U1","SM-G973W"], "not_rootable", "locked", "Permanently locked.", 0),
   v("International (Exynos 9820)", ["SM-G973F","SM-G973F/DS"], None, None, "Unlockable; best custom-ROM support of any Exynos generation.", 1)],
 "samsung-galaxy-note-10-plus": [
   v("US / Canada (Snapdragon 855)", ["SM-N975U","SM-N975U1","SM-N975W"], "not_rootable", "locked", "Permanently locked.", 0),
   v("International (Exynos 9825)", ["SM-N975F","SM-N975F/DS"], None, None, "Unlockable.", 1)],
 "samsung-galaxy-z-fold-4": [
   v("US carriers", ["SM-F936U","SM-F936U1"], "not_rootable", "locked", "Permanently locked.", 0),
   v("International", ["SM-F936B","SM-F936B/DS"], None, None, "Unlockable.", 1)],
 "samsung-galaxy-a54": [
   v("Global (Exynos 1380)", ["SM-A546E","SM-A546B"], None, None, "Unlockable in download mode; root works, ROMs scarce.", 0),
   v("North America (locked carriers)", ["SM-A546W","SM-A546U"], "not_rootable", "locked", "Locked where carrier-distributed.", 1)],
 "google-pixel-7-pro": [
   v("Unlocked / international", ["GP4BC","GE2AE"], None, None, "OEM unlocking works; root normally.", 0),
   v("Verizon", ["GFE4J"], "not_rootable", "locked", "OEM unlocking permanently greyed out — Verizon Pixel bootloaders have never been unlockable.", 1)],
 "google-pixel-7": [
   v("Unlocked / international", ["GVU6C","GQML3"], None, None, "OEM unlocking works.", 0),
   v("Verizon", ["GO3Z5"], "not_rootable", "locked", "Bootloader permanently locked.", 1)],
 "google-pixel-6": [
   v("Unlocked / international", ["GB7N6 (unlocked channel)"], None, None, "OEM unlocking works — note the same GB7N6 model number is also sold locked by Verizon.", 0),
   v("Verizon", ["GB7N6 (Verizon)"], "not_rootable", "locked", "Bootloader permanently locked despite the identical model number.", 1)],
 "google-pixel-6-pro": [
   v("Unlocked / international", ["GLUOG","G8VOU"], None, None, "OEM unlocking works.", 0),
   v("Verizon", ["GF5KQ"], "not_rootable", "locked", "Bootloader permanently locked.", 1)],
 "google-pixel-8": [
   v("Unlocked / international", ["GKWS6","GZPFO"], None, None, "OEM unlocking works.", 0),
   v("Verizon", ["G9BQD"], "not_rootable", "locked", "Bootloader permanently locked.", 1)],
 "google-pixel-8-pro": [
   v("Unlocked / international", ["GC3VE"], None, None, "OEM unlocking works.", 0),
   v("Verizon", ["G1MNW"], "not_rootable", "locked", "Bootloader permanently locked.", 1)],
 "google-pixel-fold": [
   v("Unlocked / international", ["G9FPL"], None, None, "OEM unlocking works.", 0),
   v("Verizon", ["G0B96"], "not_rootable", "locked", "Bootloader permanently locked.", 1)],
 "oneplus-7-pro": [
   v("Global / EU / India", ["GM1910","GM1911","GM1913","GM1917"], None, None, "Direct fastboot oem unlock.", 0),
   v("T-Mobile USA", ["GM1915"], "partially", "limited", "SIM-unlock 40+ days required before OnePlus allows OEM unlock; then unlocks normally.", 1)],
 "oneplus-8-pro": [
   v("Global / EU / India", ["IN2020","IN2023","IN2025"], None, None, "Direct fastboot oem unlock.", 0),
   v("T-Mobile USA", ["IN2017"], "partially", "limited", "Requires carrier SIM unlock first.", 1)],
 "oneplus-10-pro": [
   v("Global / EU / India", ["NE2210","NE2213","NE2215"], None, None, "Direct fastboot oem unlock.", 0),
   v("T-Mobile USA", ["NE2217"], "partially", "limited", "Requires carrier SIM unlock plus OnePlus unlock token.", 1)],
 "lg-v20": [
   v("Open-market US996", ["US996"], None, None, "Official LG unlock portal support.", 0),
   v("T-Mobile H918", ["H918"], "partially", "limited", "Exploit-based unlock (DirtySanta lineage); works but fragile.", 1),
   v("Verizon VS995 / AT&T H910", ["VS995","H910"], "not_rootable", "locked", "No unlock path exists.", 2)],
 "motorola-moto-g7-power": [
   v("Retail unlocked", ["XT1955-4","XT1955-5 (retail)"], None, None, "Motorola portal unlock supported.", 0),
   v("Carrier-branded (Metro/Cricket)", ["XT1955-5 (carrier)","XT1955-7"], "not_rootable", "locked", "Motorola refuses unlock codes for carrier SKUs.", 1)],
}

# ---------------------------------------------------------------- roms
def r(name, android, official, status, url, notes=None, maintainers=None):
    return dict(name=name, android_version=android, official=official, status=status,
                download_url=url, notes=notes, maintainers=maintainers or [])

ROMS = {
 "google-pixel-7-pro": [
   r("LineageOS 22 (official)","15",True,"active","https://download.lineageos.org/devices/cheetah",maintainers=[{"name":"LineageOS team","url":"https://wiki.lineageos.org/devices/cheetah"}]),
   r("crDroid 11","15",False,"active","https://crdroid.net/cheetah/11",notes="Feature-dense AOSP; unofficial build."),
   r("GrapheneOS","16",True,"active","https://grapheneos.org/releases#cheetah-stable",notes="Security-first distribution; root is possible but explicitly unsupported.",maintainers=[{"name":"GrapheneOS project","url":"https://grapheneos.org"}]),
   r("CalyxOS","15",True,"active","https://calyxos.org/",maintainers=[{"name":"Calyx Institute","url":"https://calyxos.org"}])],
 "google-pixel-8-pro": [r("LineageOS 22 (official)","15",True,"active","https://download.lineageos.org/devices/husky"), r("GrapheneOS","16",True,"active","https://grapheneos.org/releases#husky-stable"), r("crDroid 11","15",False,"active","https://crdroid.net/husky/11")],
 "google-pixel-8": [r("LineageOS 22 (official)","15",True,"active","https://download.lineageos.org/devices/shiba"), r("GrapheneOS","16",True,"active","https://grapheneos.org/releases#shiba-stable")],
 "google-pixel-8a": [r("GrapheneOS","16",True,"active","https://grapheneos.org/releases#akita-stable")],
 "google-pixel-7": [r("LineageOS 22 (official)","15",True,"active","https://download.lineageos.org/devices/panther"), r("GrapheneOS","16",True,"active","https://grapheneos.org/releases#panther-stable")],
 "google-pixel-7a": [r("LineageOS 22 (official)","15",True,"active","https://download.lineageos.org/devices/lynx"), r("GrapheneOS","16",True,"active","https://grapheneos.org/releases#lynx-stable")],
 "google-pixel-6-pro": [r("LineageOS 22 (official)","15",True,"active","https://download.lineageos.org/devices/raven"), r("GrapheneOS","15",True,"active","https://grapheneos.org/releases#raven-stable")],
 "google-pixel-6": [r("LineageOS 22 (official)","15",True,"active","https://download.lineageos.org/devices/oriole"), r("GrapheneOS","15",True,"active","https://grapheneos.org/releases#oriole-stable")],
 "google-pixel-6a": [r("LineageOS 22 (official)","15",True,"active","https://download.lineageos.org/devices/bluejay"), r("GrapheneOS","15",True,"active","https://grapheneos.org/releases#bluejay-stable")],
 "google-pixel-5": [r("LineageOS 22 (official)","15",True,"active","https://download.lineageos.org/devices/redfin"), r("/e/OS (community)","14",False,"active","https://community.e.foundation/")],
 "google-pixel-4a": [r("LineageOS 21 (official)","14",True,"active","https://download.lineageos.org/devices/sunfish"), r("crDroid 10","14",False,"active","https://crdroid.net/sunfish/10")],
 "google-pixel-3-xl": [r("LineageOS 20 (official)","13",True,"active","https://download.lineageos.org/devices/crosshatch")],
 "oneplus-7-pro": [
   r("LineageOS 22 (official)","15",True,"active","https://download.lineageos.org/devices/guacamole",maintainers=[{"name":"LineageOS team","url":"https://wiki.lineageos.org/devices/guacamole"}]),
   r("crDroid 11","15",False,"active","https://crdroid.net/guacamole/11"),
   r("OmniROM","14",True,"active","https://dl.omnirom.org/guacamole/",maintainers=[{"name":"OmniROM","url":"https://omnirom.org"}]),
   r("RisingOS (unofficial)","15",False,"active","https://sourceforge.net/projects/risingos-official/files/")],
 "oneplus-11": [
   r("LineageOS 22 (official)","15",True,"active","https://download.lineageos.org/devices/salami"),
   r("Nameless AOSP","15",False,"active","https://nameless.wiki/")],
 "oneplus-12": [r("Nameless AOSP (unofficial)","15",False,"active","https://nameless.wiki/")],
 "oneplus-8-pro": [r("LineageOS 21 (official)","14",True,"active","https://download.lineageos.org/devices/instantnoodle"), r("crDroid 10","14",False,"active","https://crdroid.net/instantnoodle/10")],
 "oneplus-9-pro": [r("LineageOS 22 (official)","15",True,"active","https://download.lineageos.org/devices/lemonadep"), r("Evolution X (unofficial)","15",False,"active","https://evolution-x.org/")],
 "oneplus-6t": [r("LineageOS 21 (official)","14",True,"active","https://download.lineageos.org/devices/fajita"), r("Pixel Experience (archived)","13",True,"discontinued","https://download.pixelexperience.org/fajita",notes="Project discontinued 2024; images archived for completeness.")],
 "xiaomi-poco-f3": [
   r("LineageOS 22 (official)","15",True,"active","https://download.lineageos.org/devices/alioth",maintainers=[{"name":"LineageOS team","url":"https://wiki.lineageos.org/devices/alioth"}]),
   r("crDroid 11","15",False,"active","https://crdroid.net/alioth/11"),
   r("RisingOS","15",False,"active","https://sourceforge.net/projects/risingos-official/files/"),
   r("Xiaomi.eu HyperOS (stock-based, debloated)","15",False,"active","https://xiaomi.eu/community/",notes="Weekly stock-based builds; lower risk than full ROM hopping.")],
 "xiaomi-poco-f5": [r("crDroid 11","15",False,"active","https://crdroid.net/marble/11"), r("Xiaomi.eu HyperOS","15",False,"active","https://xiaomi.eu/community/")],
 "xiaomi-redmi-k20-pro": [r("crDroid 10","14",False,"active","https://crdroid.net/raphael/10"), r("Evolution X (unofficial, EOL)","14",False,"discontinued","https://sourceforge.net/projects/evolution-x/files/raphael/")],
 "xiaomi-mi-9": [r("crDroid 10","14",False,"active","https://crdroid.net/cepheus/10"), r("LineageOS 21 (official)","14",True,"active","https://download.lineageos.org/devices/cepheus")],
 "xiaomi-mi-11": [r("crDroid 10","14",False,"active","https://crdroid.net/venus/10"), r("Xiaomi.eu HyperOS","15",False,"active","https://xiaomi.eu/community/")],
 "xiaomi-poco-x3-pro": [r("LineageOS 21 (official)","14",True,"active","https://download.lineageos.org/devices/vayu"), r("crDroid 10","14",False,"active","https://crdroid.net/vayu/10")],
 "xiaomi-redmi-note-10-pro": [r("crDroid 10","14",False,"active","https://crdroid.net/sweet/10"), r("Project Elixir (unofficial)","14",False,"active","https://projectelixiros.com/")],
 "xiaomi-redmi-note-8": [r("Pixel Experience (archived)","13",True,"discontinued","https://download.pixelexperience.org/ginkgo")],
 "nothing-phone-1": [r("crDroid 11","15",False,"active","https://crdroid.net/spacewar/11"), r("Nameless AOSP","15",False,"active","https://nameless.wiki/")],
 "nothing-phone-2": [r("LineageOS 22 (official)","15",True,"active","https://download.lineageos.org/devices/pong"), r("DerpFest (unofficial)","15",False,"active","https://sourceforge.net/projects/derpfest/files/")],
 "samsung-galaxy-s23": [r("LineageOS 21 (unofficial, Exynos B-model only)","14",False,"active","https://xdaforums.com/",notes="Exynos international variant only; early stability. US units cannot flash at all.")],
 "samsung-galaxy-s10": [r("LineageOS 22 (official, Exynos)","15",True,"active","https://download.lineageos.org/devices/beyond1"), r("crDroid 11 (Exynos)","15",False,"active","https://crdroid.net/beyond1/11")],
 "samsung-galaxy-a54": [r("LineageOS GSI (community-tested)","15",False,"active","https://sourceforge.net/projects/andyyan-gsi/",notes="Generic System Image — works well after phh overlays; not a device ROM.")],
 "motorola-edge-40-pro": [r("LineageOS 22 (official)","15",True,"active","https://download.lineageos.org/devices/rtwo")],
 "sony-xperia-1-v": [r("LineageOS 22 (official)","15",True,"active","https://download.lineageos.org/devices/pdx234"), r("Sony Open Devices AOSP","15",True,"active","https://developer.sony.com/open-source/aosp-on-xperia-open-devices")],
 "asus-zenfone-9": [r("LineageOS 22 (official)","15",True,"active","https://download.lineageos.org/devices/ai2202")],
 "fairphone-5": [r("/e/OS (official)","15",True,"active","https://doc.e.foundation/devices/fp5"), r("iodéOS","15",True,"active","https://iode.tech/"), r("CalyxOS","15",True,"active","https://calyxos.org/")],
 "fairphone-4": [r("/e/OS (official)","14",True,"active","https://doc.e.foundation/devices/fp4"), r("LineageOS 21 (official)","14",True,"active","https://download.lineageos.org/devices/FP4")],
 "essential-phone": [r("LineageOS 21 (official)","14",True,"active","https://download.lineageos.org/devices/mata"), r("crDroid 10","14",False,"active","https://crdroid.net/mata/10")],
 "lg-v20": [r("LineageOS 18.1 (archived)","11",True,"archived","https://download.lineageos.org/devices/us996",notes="Latest available; no active maintainer.")],
 "google-nexus-6p": [r("LineageOS 17.1 (archived)","10",True,"archived","https://download.lineageos.org/devices/angler")],
 "htc-hd2": [r("Legacy Android builds (community)","various",False,"archived","https://xdaforums.com/c/htc-hd2.549/",notes="Historic port collection via MAGLDR/cLK.")],
}

# ---------------------------------------------------------------- tools
def t(kind, name, version, url, notes=None):
    return dict(kind=kind, name=name, version=version, url=url, notes=notes)

PIXELS = ["google-pixel-9-pro-xl","google-pixel-9","google-pixel-8-pro","google-pixel-8","google-pixel-8a","google-pixel-7-pro","google-pixel-7","google-pixel-7a","google-pixel-6-pro","google-pixel-6","google-pixel-6a"]
TOOLS = {s:[t("firmware","Google Factory Images / full OTA","latest","https://developers.google.com/android/images","Full factory + OTA images; always keep the matching build before flashing.")] for s in PIXELS}
for s_url, rec in [("google-pixel-7-pro","https://twrp.me/google/googlepixel7pro.html"), ("google-pixel-7","https://twrp.me/google/googlepixel7.html")]:
    TOOLS[s_url].append(t("recovery","TWRP (official)","3.7.x",rec))
TOOLS.update({
 "xiaomi-poco-f3": [t("recovery","OrangeFox Recovery (official)","R12.1","https://orangefox.download/device/alioth"), t("recovery","TWRP (official)","3.7.x","https://twrp.me/xiaomi/xiaomipocof3.html"), t("firmware","XiaomiFirmwareUpdater (stock fastboot tgz)","latest","https://xiaomifirmwareupdater.com/")],
 "xiaomi-poco-f5": [t("recovery","OrangeFox Recovery (official)","R12.1","https://orangefox.download/device/marble")],
 "xiaomi-poco-x3-pro": [t("recovery","OrangeFox Recovery (official)","R11.1","https://orangefox.download/device/vayu")],
 "xiaomi-redmi-k20-pro": [t("recovery","OrangeFox Recovery (official)","R12.1","https://orangefox.download/device/raphael")],
 "xiaomi-mi-9": [t("recovery","OrangeFox Recovery (official)","R12.1","https://orangefox.download/device/cepheus")],
 "xiaomi-redmi-note-10-pro": [t("recovery","OrangeFox Recovery (official)","R12.1","https://orangefox.download/device/sweet")],
 "oneplus-7-pro": [t("recovery","TWRP (official)","3.7.x","https://twrp.me/oneplus/oneplus7pro.html"), t("other","MSM Download Tool (unbrick)","OOS 11","https://xdaforums.com/",notes="Qualcomm EDL restore; revives hard bricks — know it exists before you need it.")],
 "oneplus-8-pro": [t("other","MSM Download Tool (unbrick)","OOS 11","https://xdaforums.com/"), t("recovery","TWRP (official)","3.7.x","https://twrp.me/oneplus/oneplus8pro.html")],
 "oneplus-nord": [t("recovery","TWRP (official)","3.7.x","https://twrp.me/oneplus/oneplusnord.html")],
 "samsung-galaxy-s10": [t("firmware","SamFW / Frija (stock firmware)","latest","https://samfw.com/firmware/SM-G973F","Stock tar source for Odin flashing.")],
 "samsung-galaxy-s23": [t("firmware","SamFW / Frija (stock firmware)","latest","https://samfw.com/firmware/SM-S911B","Used to build the Magisk-patched AP tar on international variants.")],
 "samsung-galaxy-s23-ultra": [t("firmware","SamFW / Frija (stock firmware)","latest","https://samfw.com/firmware/SM-S918B")],
 "nothing-phone-1": [t("recovery","TWRP (unofficial)","3.7.x","https://xdaforums.com/")],
 "nothing-phone-2": [t("recovery","TWRP (unofficial)","3.7.x","https://xdaforums.com/")],
 "motorola-edge-40-pro": [t("other","Motorola Rescue / LMSA firmware","latest","https://mirrors.lolinet.com/firmware/lenomola/")],
 "sony-xperia-1-v": [t("other","newflasher (flash + TA backup)","latest","https://xdaforums.com/",notes="Backs up TA partition DRM keys before unlock — do this first.")],
 "essential-phone": [t("firmware","Essential factory images archive","latest","https://github.com/EssentialOpenSource")],
 "htc-hd2": [t("other","MAGLDR / cLK bootloaders","1.13","https://xdaforums.com/c/htc-hd2.549/","Required bootstrap for Android on HD2.")],
})

# ---------------------------------------------------------------- software
def s(kind, name, slug, desc, url, source_url=None, fw=None, author=None, needs_root=True, status="active"):
    return dict(kind=kind, framework=fw, artifact="apk", name=name, slug=slug, description=desc,
                download_url=url, source_repo_url=source_url, author_name=author, requires_root=needs_root, status=status)

SOFTWARE = [
 s("app","AdAway","adaway","System-wide ad blocking via hosts file — the root essential since 2011.","https://adaway.org","https://github.com/AdAway/AdAway",author="AdAway team"),
 s("app","Swift Backup","swift-backup","The Titanium Backup successor: full app data, SMS, call logs, cloud targets.","https://swiftapps.org",author="Swift Apps"),
 s("app","Titanium Backup","titanium-backup","Legendary backup tool. Archived, but still works on older Android.","https://www.titaniumtrack.com/titanium-backup.html",author="Titanium Track",status="archived"),
 s("app","Termux","termux","Full Linux terminal environment; root unlocks tsu and deeper hardware access.","https://f-droid.org/en/packages/com.termux/","https://github.com/termux/termux-app",author="Termux team",needs_root=False),
 s("app","SD Maid SE","sd-maid-se","System cleaner that goes deep with root: corpse finder, AppCleaner, storage analyzer.","https://github.com/d4rken-org/sdmaid-se","https://github.com/d4rken-org/sdmaid-se",author="darken"),
 s("app","MiXplorer Silver","mixplorer-silver","The definitive root file manager; XDA-distributed for two decades.","https://xdaforums.com/",author="Hootan Parsa"),
 s("app","EX Kernel Manager","ex-kernel-manager","Tune CPU/GPU frequencies, vibration, display calibration on any kernel.","https://xdaforums.com/",author="flar2"),
 s("app","ReVanced Manager","revanced-manager","Builds patched apps client-side; root-install and non-root modes.","https://revanced.app","https://github.com/ReVanced/revanced-manager",author="ReVanced",needs_root=False),
 s("app","KernelSU Manager","kernelsu-manager","Manager UI for KernelSU / KernelSU Next. Standalone app, not a module.","https://github.com/KernelSU-Next/KernelSU-Next/releases","https://github.com/KernelSU-Next/KernelSU-Next",author="KernelSU Next team"),
 s("app","Magisk","magisk","Root manager and module host; ships as the APK you patch boot images with.","https://github.com/topjohnwu/Magisk/releases","https://github.com/topjohnwu/Magisk",author="topjohnwu"),
 s("module","LSPosed","lsposed","Runtime module framework (Zygisk successor): hooks and extends apps without modifying APKs. Ships as an APK but plugs into a framework — so it's a module.","https://github.com/LSPosed/LSPosed/releases","https://github.com/LSPosed/LSPosed","lsposed","LSPosed team"),
 s("module","Play Integrity Fix","play-integrity-fix","Spoofs device attestation so banking and streaming apps accept rooted setups.","https://github.com/chiteroman/PlayIntegrityFix/releases","https://github.com/chiteroman/PlayIntegrityFix","magisk","chiteroman"),
 s("module","Shamiko","shamiko","Zygisk module hiding root from a configured denylist with minimal footprint.","https://github.com/LSPosed/LSPosed.github.io/releases","https://github.com/LSPosed/LSPosed.github.io","magisk","LSPosed team"),
 s("module","ViPER4Android Re-Engineered","viper4android-re","System-wide audio processing engine — the reference audio mod.","https://github.com/programminghoch10/ViPER4AndroidRepackaged/releases","https://github.com/ArianK16a/android_audio_viper4android","magisk","ViPER maintainers"),
 s("module","Advanced Charging Controller (AccA)","acca","Battery charging limits and schedules to extend lifespan, via the acc daemon.","https://github.com/VR-25/acc/releases","https://github.com/VR-25/acc","magisk","VR-25"),
 s("module","BCR (Basic Call Recorder)","bcr-call-recorder","Automatic call recording for Magisk/KernelSU without a background app.","https://github.com/chenxiaolong/BCR/releases","https://github.com/chenxiaolong/BCR","magisk","Andrew Gunnerson"),
 s("module","Zygisk Next","zygisk-next","Standalone Zygisk implementation for KernelSU and APatch.","https://github.com/Dr-TSNG/ZygiskNext/releases","https://github.com/Dr-TSNG/ZygiskNext","kernelsu","Dr-TSNG"),
 s("module","Vector Surface Tweaks","vector-surface-tweaks","Display and refresh-rate tuning built for the Vector runtime.","https://github.com/VectorFramework","https://github.com/VectorFramework","vector","Vector project"),
]

# ---------------------------------------------------------------- universal methods
METHODS = [
  dict(name="KernelSU Next", weight=100, difficulty="moderate",
       summary="Kernel-based root with full module support — best default choice and Play Integrity posture in 2026.",
       body_md="Flash a KernelSU Next build for your kernel (or patch boot/init_boot), then manage modules and per-app profiles in the manager.",
       requires=["unlocked bootloader","GKI-compatible kernel"],
       links=[{"label":"KernelSU Next (GitHub)","url":"https://github.com/KernelSU-Next/KernelSU-Next"},{"label":"Docs","url":"https://kernelsu.org"}],
       integrity="Strongest out-of-box posture; add Play Integrity Fix module if a bank still complains."),
  dict(name="KernelSU", weight=90, difficulty="moderate",
       summary="The original kernel-space root. Stable, shares the Magisk module format.",
       body_md="Flash a KernelSU-enabled kernel or patch the boot image; install the manager app.",
       requires=["unlocked bootloader","GKI 2.0 kernel (Android 12+ launch devices) or custom GKI kernel"],
       links=[{"label":"KernelSU","url":"https://kernelsu.org"}],
       integrity="Zygisk + Play Integrity Fix recommended for banking apps."),
  dict(name="Magisk", weight=80, difficulty="easy",
       summary="The classic systemless root — patches boot images, leaves /system untouched.",
       body_md="Patch the stock boot/init_boot image in the Magisk app, flash it in fastboot, reboot.",
       requires=["unlocked bootloader","stock boot image for your exact build"],
       links=[{"label":"Magisk (GitHub)","url":"https://github.com/topjohnwu/Magisk"}],
       integrity="Add DenyList/Zygisk + Play Integrity Fix on Android 14+."),
  dict(name="APatch", weight=60, difficulty="advanced",
       summary="Kernel-patching root for kernels where KernelSU doesn't build. Magisk-style UI.",
       body_md="Follow APatch docs for the target kernel; patch and flash per instructions.",
       requires=["unlocked bootloader","kernel 4.14+ with KPM support"],
       links=[{"label":"APatch (GitHub)","url":"https://github.com/bmax121/APatch"}],
       integrity="Similar posture to KernelSU, smaller community."),
  dict(name="Magisk Delta / Kitsune", weight=40, difficulty="moderate",
       summary="Community Magisk fork with built-in hiding (MagiskHide-era approach).",
       body_md="Install Kitsune Mask, patch the boot image, flash, configure built-in hiding.",
       requires=["unlocked bootloader"],
       links=[{"label":"Kitsune Mask (GitLab)","url":"https://gitlab.com/HuskyDG/magisk-files"}],
       integrity="Convenient hiding; upstream + modules is more future-proof."),
  dict(name="SuperSU (legacy)", weight=10, difficulty="easy",
       summary="Chainfire's original root. For pre-2016 devices only.",
       body_md="Flash the SuperSU zip in custom recovery on legacy devices.",
       requires=["custom recovery"],
       links=[{"label":"CF-Auto-Root archive","url":"https://autoroot.chainfire.eu"}],
       integrity="Historic reference only."),
]

# ---------------------------------------------------------------- guides / Q&A / issues
GUIDE_GENERIC_1 = dict(title="Read this first: backups before you touch anything",
  summary="Twenty minutes now saves a bricked weekend later.", kind="other", difficulty="easy")
GUIDE_GENERIC_2 = dict(title="Universal: how unlocking actually works",
  summary="The concepts behind every manufacturer unlock flow.", kind="unlock_bootloader", difficulty="easy")
GUIDE_P7P = dict(title="Root your Pixel 7 Pro (KernelSU Next or Magisk)",
  summary="From stock to managed root in one sitting, with Play Integrity guidance.", kind="root", difficulty="moderate")

Q_BLOCKS = [
 dict(title="Will rooting my Pixel 7 Pro break banking apps?", body="Thinking of KernelSU Next. Google Wallet and my bank currently work — don't want to lose them.", status="solved", device="google-pixel-7-pro"),]
QUESTIONS = [
  dict(device="google-pixel-7-pro", title="Will rooting my Pixel 7 Pro break banking apps?",
       body="Thinking of KernelSU Next. Google Wallet and my bank currently work — don't want to lose them.",
       status="solved",
       answers=[("Mostly no in 2026: KernelSU Next + Zygisk + Play Integrity Fix passes Google Wallet and virtually all banks. Add each banking app to the denylist and keep Play Integrity Fix updated — treat it as light maintenance, roughly fifteen minutes a month.", True),
                ("If your bank requires hardware STRONG attestation beyond DEVICE integrity, nothing client-side fixes it. Test before committing.", False)]),
  dict(device="google-pixel-7-pro", title="init_boot or boot — which do I patch on Android 15?",
       body="Older guides say patch boot.img, newer ones say init_boot. On current stock, which one?", status="solved",
       answers=[("init_boot.img. On devices that launched with Android 13+, the generic ramdisk moved to init_boot. Patch init_boot with Magisk/KernelSU Next and flash to the init_boot partition. Flashing boot leaves you without root (and on some builds without Wi-Fi).", True)]),
  dict(device="xiaomi-poco-f3", title="POCO F3, Redmi K40 and Mi 11X — actually the same phone?",
       body="Can I flash a K40 ROM on my Mi 11X?", status="solved",
       answers=[("Yes — all three are codename alioth with an identical PCB; standard fastboot builds flash across all labels. Region-specific carrier tweaks can differ in baseband config, but LineageOS/crDroid alioth builds are universal.", True)]),
  dict(device="samsung-galaxy-s23", title="Verizon S23 — any hope of root at all?",
       body="SM-S911U on Verizon. Saw an old thread about an exploit.", status="answered",
       answers=[("No. US Snapdragon Samsung bootloaders are fused off; the exploit threads you found are about much older Exynos models or are clickbait. If rooting matters, sell it and buy an international SM-S911B — used prices are practically identical.", True)]),
]
ISSUES = [
  dict(device="google-pixel-7-pro", title="OEM unlocking toggle greyed out even after SIM unlock",
       body="Factory-reset twice, toggle still greyed. Bought used from a carrier listing.", severity="high", status="confirmed",
       resolution="Verified: the unit is a Verizon GFE4J. Verizon permanently locks Pixel bootloaders at factory; no software fix exists. The root guide now checks this first via question block."),
  dict(device="xiaomi-poco-x3-pro", title="Hard brick after flashing older MIUI (ARB violation)",
       body="Flashed a V12.5.x fastboot ROM after V13 — now dead, no fastboot, no heartbeat.", severity="critical", status="confirmed",
       resolution="Device anti-rollback index was incremented in V13. Flashing a lower-ARB image bricks the boot chain outside authorized EDL. Warning added to the device page and the Xiaomi unlock guide."),
  dict(device="oneplus-7-pro", title="A/B OTA fails after rooting stock ROM",
       body="Rooted with a Magisk boot patch; monthly OTA now fails to install.", severity="medium", status="fixed",
       resolution="Use Magisk's 'install to inactive slot after OTA': install the OTA first (do not reboot), then Magisk → Install → Inactive slot, then reboot."),
  dict(device="xiaomi-poco-f3", title="'The system has been destroyed' after relocking on a custom ROM",
       body="Re-locked the bootloader with crDroid installed.", severity="critical", status="wontfix",
       resolution="Never relock with anything but fully stock signed images. Recovery: Mi Unlock again, flash a stock tgz, then (optionally) relock."),
]

# ---------------------------------------------------------------- SQL emit helpers
TYPE = {
 "slug":"text","brand":"text","name":"text","model":"text","codename":"text","aliases":"text[]",
 "release_year":"int","android_versions":"text[]","soc":"text","ram_options":"text[]","specs":"jsonb",
 "popularity":"int","device_id":"uuid","verdict":"rootability_verdict","bootloader":"bootloader_status",
 "recommended_method_id":"uuid","unlock_url":"text","unlock_wait_hours":"int","anti_rollback":"boolean",
 "warnings":"text[]","notes":"text","label":"text","model_numbers":"text[]","bootloader_notes":"text",
 "sort_order":"int","variant_id":"uuid","android_version":"text","official":"boolean","status":"catalog_status",
 "download_url":"text","maintainers":"jsonb","provenance":"provenance_kind","source_repo_url":"text",
 "build_config_url":"text","kind":"text","version":"text","url":"text","weight":"int","difficulty":"difficulty_level",
 "summary":"text","body_md":"text","requires":"text[]","links":"jsonb","play_integrity_notes":"text",
 "admin_curated":"boolean","framework":"module_framework","artifact":"artifact_type","description":"text",
 "author_name":"text","requires_root":"boolean",
}

def batch(table, cols, rows, extra="", type_overrides=None):
    """INSERT ... SELECT from jsonb_to_recordset. Device references: device_id holds a slug string."""
    keys = [c.strip() for c in cols.split(",")]
    ovr = type_overrides or {}
    typed = ", ".join(f"{c} {ovr.get(c, TYPE[c])}" for c in keys)
    joined = any(c == "device_id" for c in keys)
    sel = []
    for c in keys:
        if c == "device_id" and joined:
            sel.append("d.id")
        else:
            sel.append(f"x.{c}")
    if joined:
        froms = ("jsonb_to_recordset($seed$%s$seed$) as x(%s)\n"
                 "left join public.devices d on d.slug = x.device_id" ) % (json.dumps(rows, ensure_ascii=False), typed.replace("device_id uuid", "device_id text"))
        where = "\nwhere (x.device_id::text) is null or d.id is not null"
    else:
        froms = "jsonb_to_recordset($seed$%s$seed$) as x(%s)" % (json.dumps(rows, ensure_ascii=False), typed)
        where = ""
    return f"insert into public.{table} ({', '.join(keys)})\nselect {', '.join(sel)}\nfrom {froms}{where}{(' ' + extra) if extra else ''};"

def q(s):
    return "'" + str(s).replace("'", "''") + "'"

# ---------------------------------------------------------------- file A: base
A = ["-- 0002a: curator user, devices, rootability, variants, universal root methods (generated)."]
A.append("create extension if not exists pgcrypto;")
A.append("""-- Seed curator profile (system account for starter guides/Q&A)
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-8000-000000000001',
  'authenticated', 'authenticated', 'curator@rootdb.app', crypt('curator-disabled-login', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"RootDB Curator"}', now(), now())
on conflict (id) do nothing;
insert into public.profiles (id, username, display_name, role, is_verified_dev)
values ('a0000000-0000-4000-8000-000000000001', 'rootdb_curator', 'RootDB Curator', 'admin', false)
on conflict (id) do update set username = 'rootdb_curator', display_name = 'RootDB Curator', role = 'admin';""")

dev_rows = [dict(slug=d["slug"], brand=d["brand"], name=d["name"], model=d["model"], codename=d["codename"],
                 aliases=d.get("aliases", []), release_year=d["year"], android_versions=d["android"], soc=d["soc"],
                 ram_options=d.get("ram", []), specs={}, popularity=d["pop"]) for d in DEVICES]
A.append(batch("devices", "slug,brand,name,model,codename,aliases,release_year,android_versions,soc,ram_options,specs,popularity", dev_rows, "on conflict (slug) do nothing"))

root_rows = [dict(device_id=d["slug"], verdict=d["verdict"], bootloader=d["bootloader"],
                  recommended_method_id=None, unlock_url=d.get("unlock_url"), unlock_wait_hours=d.get("wait"),
                  anti_rollback=bool(d.get("ar")), warnings=d.get("warnings", []), notes=d.get("notes") or d.get("unlock"))
             for d in DEVICES]
A.append(batch("device_rootability", "device_id,verdict,bootloader,recommended_method_id,unlock_url,unlock_wait_hours,anti_rollback,warnings,notes", root_rows, "on conflict (device_id) do update set verdict = excluded.verdict, bootloader = excluded.bootloader"))

var_rows = [dict(device_id=slug, label=vv["label"], model_numbers=vv["model_numbers"], verdict=vv["verdict"],
                 bootloader=vv["bootloader"], bootloader_notes=vv["bootloader_notes"], sort_order=vv["sort_order"], warnings=[])
            for slug, vs in VARIANTS.items() for vv in vs]
A.append(batch("device_variants", "device_id,label,model_numbers,verdict,bootloader,bootloader_notes,sort_order,warnings", var_rows))

m_rows = [dict(device_id=None, name=m["name"], weight=m["weight"], difficulty=m["difficulty"], summary=m["summary"],
               body_md=m["body_md"], requires=m["requires"], links=m["links"], play_integrity_notes=m["integrity"],
               admin_curated=True, provenance="community") for m in METHODS]
A.append(batch("root_methods", "device_id,name,weight,difficulty,summary,body_md,requires,links,play_integrity_notes,admin_curated,provenance", m_rows))

# ---------------------------------------------------------------- file B: catalog
B = ["-- 0002b: ROMs, tools, software (generated). Run once. Idempotent only on slug tables."]
rom_rows = []
for slug, rs in ROMS.items():
    for rr in rs:
        rom_rows.append(dict(device_id=slug, variant_id=None, name=rr["name"], android_version=rr["android_version"],
                             official=rr["official"], status=rr["status"], download_url=rr["download_url"], notes=rr["notes"],
                             maintainers=rr["maintainers"], provenance="official_verified" if rr["official"] else "link_submission",
                             source_repo_url=None, build_config_url=None))
B.append(batch("roms", "device_id,variant_id,name,android_version,official,status,download_url,notes,maintainers,provenance,source_repo_url,build_config_url", rom_rows))

tool_rows = [dict(device_id=slug, variant_id=None, kind=tt["kind"], name=tt["name"], version=tt.get("version"),
                  url=tt["url"], notes=tt.get("notes"), provenance="link_submission") for slug, ts in TOOLS.items() for tt in ts]
B.append(batch("tools", "device_id,variant_id,kind,name,version,url,notes,provenance", tool_rows))

soft_rows = [dict(kind=sw["kind"], framework=sw["framework"], artifact=sw["artifact"], name=sw["name"], slug=sw["slug"],
                  description=sw["description"], author_name=sw["author_name"], source_repo_url=sw["source_repo_url"],
                  download_url=sw["download_url"], version=None, requires_root=sw["requires_root"], status=sw["status"],
                  provenance="official_verified" if sw.get("source_repo_url") else "link_submission") for sw in SOFTWARE]
B.append(batch("software", "kind,framework,artifact,name,slug,description,author_name,source_repo_url,download_url,version,requires_root,status,provenance", soft_rows, "on conflict (slug) do nothing", type_overrides={"kind": "software_kind"}))

# ---------------------------------------------------------------- file C: content (guides, Q&A, issues)
C = ["-- 0002c: sample guides (block structure), Q&A and issues (generated)."]
C.append("""do $$
declare
  curator uuid := 'a0000000-0000-4000-8000-000000000001';
  g_backup uuid; g_unlock uuid; g_p7p uuid;
  b_intro uuid; b_q uuid; b_verizon uuid;
  dev uuid;
begin""")
C.append(f"""  -- generic guides (device_id null → embeddable anywhere)
  select id into dev from public.devices where slug = 'google-pixel-7-pro';
  insert into public.guides (device_id, kind, title, summary, difficulty, source, author_id, published)
    values (null, {q(GUIDE_GENERIC_1["kind"])}, {q(GUIDE_GENERIC_1["title"])}, {q(GUIDE_GENERIC_1["summary"])}, {q(GUIDE_GENERIC_1["difficulty"])}, 'admin', curator, true)
    returning id into g_backup;
  insert into public.guide_blocks (guide_id, position, block_type, content_md, config) values
    (g_backup, 0, 'content', '# Before any modification\n\nEvery guide on RootDB assumes you did these three things first.', '{{}}'),
    (g_backup, 1, 'content', '1. **Enable OEM unlocking and USB debugging** in developer options *even if you will not unlock today* — OEM unlocking arms the phone.\n2. **Download the exact stock firmware for your build** (factory image / fastboot tgz / Odin tar) and keep it on your PC.\n3. **Back up everything**: Swift Backup with root, platform backup otherwise. Pull DCIM manually regardless.', '{{}}');

  insert into public.guides (device_id, kind, title, summary, difficulty, source, author_id, published)
    values (null, {q(GUIDE_GENERIC_2["kind"])}, {q(GUIDE_GENERIC_2["title"])}, {q(GUIDE_GENERIC_2["summary"])}, {q(GUIDE_GENERIC_2["difficulty"])}, 'admin', curator, true)
    returning id into g_unlock;
  insert into public.guide_blocks (guide_id, position, block_type, content_md, config) values
    (g_unlock, 0, 'content', '**Unlocking wipes /data without exception** — back up first. An unlocked bootloader does not root your phone; it only permits flashing unsigned images.', '{{}}'),
    (g_unlock, 1, 'content', '**Flow per maker**: Pixel / Nothing / OnePlus → `fastboot flashing unlock`. Xiaomi → Mi Unlock tool (waits up to 168 h). Samsung (international) → OEM unlocking toggle + hold in download mode. Motorola / Sony → unlock-code portal.', '{{}}');

  -- Pixel 7 Pro root guide with branching question + recommendation block
  insert into public.guides (device_id, kind, title, summary, difficulty, source, author_id, published)
    values (dev, 'root', {q(GUIDE_P7P["title"])}, {q(GUIDE_P7P["summary"])}, {q(GUIDE_P7P["difficulty"])}, 'admin', curator, true)
    returning id into g_p7p;
  insert into public.guide_blocks (guide_id, position, block_type, content_md, config)
    values (g_p7p, 0, 'content', '# Rooting the Pixel 7 Pro\n\nThis guide is for stock Pixel units. Carrier variants are a different story.', '{{}}')
    returning id into b_intro;
  insert into public.guide_blocks (guide_id, position, block_type, content_md, config)
    values (g_p7p, 2, 'content', 'Greyed-out OEM unlocking means you have a **Verizon GFE4J** — those bootloaders have never been unlockable, and no guide can change that. The used-market unlocked GP4BC is the same phone with a working toggle.', '{{}}')
    returning id into b_verizon;
  insert into public.guide_blocks (guide_id, position, block_type, content_md, config)
    values (g_p7p, 1, 'question', null,
      jsonb_build_object('prompt', 'Is "OEM unlocking" enabled (blue, not greyed out) in Developer options?',
        'answers', jsonb_build_array(
          jsonb_build_object('label', 'No — it is greyed out', 'goto_block_id', b_verizon),
          jsonb_build_object('label', 'Yes, it toggles'))))
    returning id into b_q;
  insert into public.guide_blocks (guide_id, position, block_type, content_md, config, embed_guide_id) values
    (g_p7p, 3, 'embed', null, '{{}}', g_backup),
    (g_p7p, 4, 'embed', null, '{{}}', g_unlock);
  insert into public.guide_blocks (guide_id, position, block_type, content_md, config) values
    (g_p7p, 5, 'recommendation', null, '{{"subject": "root_method", "fallback": "global_weight"}}'),
    (g_p7p, 6, 'content', '## Flash the patched image\n\nRun:\n\n    fastboot flash init_boot patched_init_boot.img\n\nOn Android 14+ Pixels the ramdisk lives in **init_boot**, not boot. Flashing boot alone leaves you without root.', '{{}}'),
    (g_p7p, 7, 'content', '## Keep Play Integrity green\n\nInstall Zygisk (or Zygisk Next on KernelSU), add **Play Integrity Fix**, put banking apps on your denylist, reboot, then check with any Play Integrity checker from the Play Store.', '{{}}');
""")

C.append("  -- sample questions + answers")
for qi, quest in enumerate(QUESTIONS):
    C.append(f"""  select id into dev from public.devices where slug = {q(quest["device"])};
  declare qid uuid;
  begin
    insert into public.questions (device_id, author_id, title, body_md, status)
      values (dev, curator, {q(quest["title"])}, {q(quest["body"])}, {q(quest["status"])})
      returning id into qid;""")
    for abody, accepted in quest["answers"]:
        C.append(f"""    insert into public.answers (question_id, author_id, body_md, is_accepted)
      values (qid, curator, {q(abody)}, {'true' if accepted else 'false'});""")
    C.append("  end;")
C.append("  -- sample issues")
for iss in ISSUES:
    C.append(f"""  select id into dev from public.devices where slug = {q(iss["device"])};
  insert into public.issues (device_id, author_id, title, body_md, severity, status, resolution_note)
    values (dev, curator, {q(iss["title"])}, {q(iss["body"])}, {q(iss["severity"])}, {q(iss["status"])}, {q(iss["resolution"])});""")
C.append("end $$;")

# ---------------------------------------------------------------- write
out = {"0002a_seed_base.sql": "\n\n".join(A), "0002b_seed_catalog.sql": "\n\n".join(B), "0002c_seed_content.sql": "\n\n".join(C)}
for name, content in out.items():
    p = BASE / name
    p.write_text(content + "\n", encoding="utf-8")
    print(f"{name}: {len(content)} chars, {content.count('insert into')} inserts")
# legacy combined file no longer source of truth
old = BASE / "0002_seed.sql"
if old.exists():
    old.unlink()
    print("removed stale 0002_seed.sql")
