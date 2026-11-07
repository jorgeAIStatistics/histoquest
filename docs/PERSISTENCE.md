# Progress and laboratory history

HistoQuest is local to the current browser and origin. It has no server backup or account sync. Clearing site data removes both storage areas.

- Existing study progress and the active laboratory draft remain under `histoquest:state` in localStorage. The v3 → v4 migration preserves the earlier pathway, notes, exam practice and workbench records.
- Completed laboratory records are validated and committed to IndexedDB database `histoquest-lab-archive`, version 1, object store `runs`. The key is the run ID. Each record includes its seed and complete ordered event history, so the specimen state can be replayed.
- Only after a successful archive transaction may identical completed local copies leave the recent cache. The cache keeps up to 20 of the newest completed records that fit a 1 MiB serialized UTF-8 laboratory-log budget. This is an application budget to leave space for older study data and the recovery snapshot, not a browser quota guarantee. The active draft also counts toward the budget; a very large completed log may live only in the archive. Incomplete, unarchived or modified local records always remain protected regardless of size. If these protected records and the active draft alone exceed the budget, the interface warns the learner to export; it never deletes them. A browser with older completed local records migrates them on the next successful laboratory save.
- Each run is capped at 2,000 validated ordered events. Ordinary actions and automatic shift pause/resume transitions must preserve the last valid history when that limit is reached; the interface asks the learner to save/export and start another run.
- The archive is capped at 200 records and 50 MiB of serialized UTF-8 run data. These are application limits, not a promise about the browser’s available quota. Reaching either limit produces an error and retains local copies. No unexported history is silently deleted.
- Career evidence, shift queues and bench history read the union of archived records, recent local records and the active draft. The local revision takes precedence for a shared ID; the active draft takes precedence over both. A shift chooses the newest attempt by its start timestamp, independent of cache ordering.

## Complete backup and restoration

Settings → **Export progress (JSON)** reads and validates the entire archive before downloading one ordinary v4 progress file containing all study data and laboratory records. If the archive is unavailable or a record is unreadable, the export reports failure and does not claim a complete backup. Keep the downloaded file outside the browser.

**Import progress** uses the existing replace-progress confirmation. It validates/migrates the file, atomically replaces the IndexedDB archive, then writes the recent local cache and other progress. If archive capacity, permissions or validation prevent the transaction, existing data is retained. IndexedDB and localStorage are separate storage systems: if the archive succeeds but the local write fails, the interface reports the partial save and asks the learner to retain the source file and free storage before reloading. It does not report a complete import.

The explicit **Remove backed-up older archive records** control becomes available only after a successful complete export during that Settings visit. Its confirmation asks the learner to verify that the file is saved. It deletes only archive records whose content still exactly matches the exported copy and which are not current local records. Changed or unexported history is retained. Removed older records remain available only in that backup until imported again. **Erase all progress** separately clears both archive and local progress after confirmation.

Local review notes, practical results and synthetic timing are educational records. Persistence does not certify professional competency or clinical validity.
