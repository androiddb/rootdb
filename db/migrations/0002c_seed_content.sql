-- 0002c: sample guides (block structure), Q&A and issues (generated).

do $$
declare
  curator uuid := 'a0000000-0000-4000-8000-000000000001';
  g_backup uuid; g_unlock uuid; g_p7p uuid;
  b_intro uuid; b_q uuid; b_verizon uuid;
  dev uuid;
begin

  -- generic guides (device_id null → embeddable anywhere)
  select id into dev from public.devices where slug = 'google-pixel-7-pro';
  insert into public.guides (device_id, kind, title, summary, difficulty, source, author_id, published)
    values (null, 'other', 'Read this first: backups before you touch anything', 'Twenty minutes now saves a bricked weekend later.', 'easy', 'admin', curator, true)
    returning id into g_backup;
  insert into public.guide_blocks (guide_id, position, block_type, content_md, config) values
    (g_backup, 0, 'content', '# Before any modification

Every guide on RootDB assumes you did these three things first.', '{}'),
    (g_backup, 1, 'content', '1. **Enable OEM unlocking and USB debugging** in developer options *even if you will not unlock today* — OEM unlocking arms the phone.
2. **Download the exact stock firmware for your build** (factory image / fastboot tgz / Odin tar) and keep it on your PC.
3. **Back up everything**: Swift Backup with root, platform backup otherwise. Pull DCIM manually regardless.', '{}');

  insert into public.guides (device_id, kind, title, summary, difficulty, source, author_id, published)
    values (null, 'unlock_bootloader', 'Universal: how unlocking actually works', 'The concepts behind every manufacturer unlock flow.', 'easy', 'admin', curator, true)
    returning id into g_unlock;
  insert into public.guide_blocks (guide_id, position, block_type, content_md, config) values
    (g_unlock, 0, 'content', '**Unlocking wipes /data without exception** — back up first. An unlocked bootloader does not root your phone; it only permits flashing unsigned images.', '{}'),
    (g_unlock, 1, 'content', '**Flow per maker**: Pixel / Nothing / OnePlus → `fastboot flashing unlock`. Xiaomi → Mi Unlock tool (waits up to 168 h). Samsung (international) → OEM unlocking toggle + hold in download mode. Motorola / Sony → unlock-code portal.', '{}');

  -- Pixel 7 Pro root guide with branching question + recommendation block
  insert into public.guides (device_id, kind, title, summary, difficulty, source, author_id, published)
    values (dev, 'root', 'Root your Pixel 7 Pro (KernelSU Next or Magisk)', 'From stock to managed root in one sitting, with Play Integrity guidance.', 'moderate', 'admin', curator, true)
    returning id into g_p7p;
  insert into public.guide_blocks (guide_id, position, block_type, content_md, config)
    values (g_p7p, 0, 'content', '# Rooting the Pixel 7 Pro

This guide is for stock Pixel units. Carrier variants are a different story.', '{}')
    returning id into b_intro;
  insert into public.guide_blocks (guide_id, position, block_type, content_md, config)
    values (g_p7p, 2, 'content', 'Greyed-out OEM unlocking means you have a **Verizon GFE4J** — those bootloaders have never been unlockable, and no guide can change that. The used-market unlocked GP4BC is the same phone with a working toggle.', '{}')
    returning id into b_verizon;
  insert into public.guide_blocks (guide_id, position, block_type, content_md, config)
    values (g_p7p, 1, 'question', null,
      jsonb_build_object('prompt', 'Is "OEM unlocking" enabled (blue, not greyed out) in Developer options?',
        'answers', jsonb_build_array(
          jsonb_build_object('label', 'No — it is greyed out', 'goto_block_id', b_verizon),
          jsonb_build_object('label', 'Yes, it toggles'))))
    returning id into b_q;
  insert into public.guide_blocks (guide_id, position, block_type, content_md, config, embed_guide_id) values
    (g_p7p, 3, 'embed', null, '{}', g_backup),
    (g_p7p, 4, 'embed', null, '{}', g_unlock);
  insert into public.guide_blocks (guide_id, position, block_type, content_md, config) values
    (g_p7p, 5, 'recommendation', null, '{"subject": "root_method", "fallback": "global_weight"}'),
    (g_p7p, 6, 'content', '## Flash the patched image

Run:

    fastboot flash init_boot patched_init_boot.img

On Android 14+ Pixels the ramdisk lives in **init_boot**, not boot. Flashing boot alone leaves you without root.', '{}'),
    (g_p7p, 7, 'content', '## Keep Play Integrity green

Install Zygisk (or Zygisk Next on KernelSU), add **Play Integrity Fix**, put banking apps on your denylist, reboot, then check with any Play Integrity checker from the Play Store.', '{}');


  -- sample questions + answers

  select id into dev from public.devices where slug = 'google-pixel-7-pro';
  declare qid uuid;
  begin
    insert into public.questions (device_id, author_id, title, body_md, status)
      values (dev, curator, 'Will rooting my Pixel 7 Pro break banking apps?', 'Thinking of KernelSU Next. Google Wallet and my bank currently work — don''t want to lose them.', 'solved')
      returning id into qid;

    insert into public.answers (question_id, author_id, body_md, is_accepted)
      values (qid, curator, 'Mostly no in 2026: KernelSU Next + Zygisk + Play Integrity Fix passes Google Wallet and virtually all banks. Add each banking app to the denylist and keep Play Integrity Fix updated — treat it as light maintenance, roughly fifteen minutes a month.', true);

    insert into public.answers (question_id, author_id, body_md, is_accepted)
      values (qid, curator, 'If your bank requires hardware STRONG attestation beyond DEVICE integrity, nothing client-side fixes it. Test before committing.', false);

  end;

  select id into dev from public.devices where slug = 'google-pixel-7-pro';
  declare qid uuid;
  begin
    insert into public.questions (device_id, author_id, title, body_md, status)
      values (dev, curator, 'init_boot or boot — which do I patch on Android 15?', 'Older guides say patch boot.img, newer ones say init_boot. On current stock, which one?', 'solved')
      returning id into qid;

    insert into public.answers (question_id, author_id, body_md, is_accepted)
      values (qid, curator, 'init_boot.img. On devices that launched with Android 13+, the generic ramdisk moved to init_boot. Patch init_boot with Magisk/KernelSU Next and flash to the init_boot partition. Flashing boot leaves you without root (and on some builds without Wi-Fi).', true);

  end;

  select id into dev from public.devices where slug = 'xiaomi-poco-f3';
  declare qid uuid;
  begin
    insert into public.questions (device_id, author_id, title, body_md, status)
      values (dev, curator, 'POCO F3, Redmi K40 and Mi 11X — actually the same phone?', 'Can I flash a K40 ROM on my Mi 11X?', 'solved')
      returning id into qid;

    insert into public.answers (question_id, author_id, body_md, is_accepted)
      values (qid, curator, 'Yes — all three are codename alioth with an identical PCB; standard fastboot builds flash across all labels. Region-specific carrier tweaks can differ in baseband config, but LineageOS/crDroid alioth builds are universal.', true);

  end;

  select id into dev from public.devices where slug = 'samsung-galaxy-s23';
  declare qid uuid;
  begin
    insert into public.questions (device_id, author_id, title, body_md, status)
      values (dev, curator, 'Verizon S23 — any hope of root at all?', 'SM-S911U on Verizon. Saw an old thread about an exploit.', 'answered')
      returning id into qid;

    insert into public.answers (question_id, author_id, body_md, is_accepted)
      values (qid, curator, 'No. US Snapdragon Samsung bootloaders are fused off; the exploit threads you found are about much older Exynos models or are clickbait. If rooting matters, sell it and buy an international SM-S911B — used prices are practically identical.', true);

  end;

  -- sample issues

  select id into dev from public.devices where slug = 'google-pixel-7-pro';
  insert into public.issues (device_id, author_id, title, body_md, severity, status, resolution_note)
    values (dev, curator, 'OEM unlocking toggle greyed out even after SIM unlock', 'Factory-reset twice, toggle still greyed. Bought used from a carrier listing.', 'high', 'confirmed', 'Verified: the unit is a Verizon GFE4J. Verizon permanently locks Pixel bootloaders at factory; no software fix exists. The root guide now checks this first via question block.');

  select id into dev from public.devices where slug = 'xiaomi-poco-x3-pro';
  insert into public.issues (device_id, author_id, title, body_md, severity, status, resolution_note)
    values (dev, curator, 'Hard brick after flashing older MIUI (ARB violation)', 'Flashed a V12.5.x fastboot ROM after V13 — now dead, no fastboot, no heartbeat.', 'critical', 'confirmed', 'Device anti-rollback index was incremented in V13. Flashing a lower-ARB image bricks the boot chain outside authorized EDL. Warning added to the device page and the Xiaomi unlock guide.');

  select id into dev from public.devices where slug = 'oneplus-7-pro';
  insert into public.issues (device_id, author_id, title, body_md, severity, status, resolution_note)
    values (dev, curator, 'A/B OTA fails after rooting stock ROM', 'Rooted with a Magisk boot patch; monthly OTA now fails to install.', 'medium', 'fixed', 'Use Magisk''s ''install to inactive slot after OTA'': install the OTA first (do not reboot), then Magisk → Install → Inactive slot, then reboot.');

  select id into dev from public.devices where slug = 'xiaomi-poco-f3';
  insert into public.issues (device_id, author_id, title, body_md, severity, status, resolution_note)
    values (dev, curator, '''The system has been destroyed'' after relocking on a custom ROM', 'Re-locked the bootloader with crDroid installed.', 'critical', 'wontfix', 'Never relock with anything but fully stock signed images. Recovery: Mi Unlock again, flash a stock tgz, then (optionally) relock.');

end $$;
