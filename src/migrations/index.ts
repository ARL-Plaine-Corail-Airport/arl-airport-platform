import * as migration_20260320_102622 from './20260320_102622';
import * as migration_20260325_070120_add_flights_collection from './20260325_070120_add_flights_collection';
import * as migration_20260325_105948 from './20260325_105948';
import * as migration_20260326_092327_add_news_attachments from './20260326_092327_add_news_attachments';
import * as migration_20260326_093705_add_airport_project from './20260326_093705_add_airport_project';
import * as migration_20260330_091321 from './20260330_091321';
import * as migration_20260330_101549 from './20260330_101549';
import * as migration_20260330_112900_sync_pages_notices_seo from './20260330_112900_sync_pages_notices_seo';
import * as migration_20260331_113831 from './20260331_113831';
import * as migration_20260409_120000_news_events_documents from './20260409_120000_news_events_documents';

export const migrations = [
  {
    up: migration_20260320_102622.up,
    down: migration_20260320_102622.down,
    name: '20260320_102622',
  },
  {
    up: migration_20260325_070120_add_flights_collection.up,
    down: migration_20260325_070120_add_flights_collection.down,
    name: '20260325_070120_add_flights_collection',
  },
  {
    up: migration_20260325_105948.up,
    down: migration_20260325_105948.down,
    name: '20260325_105948',
  },
  {
    up: migration_20260326_092327_add_news_attachments.up,
    down: migration_20260326_092327_add_news_attachments.down,
    name: '20260326_092327_add_news_attachments',
  },
  {
    up: migration_20260326_093705_add_airport_project.up,
    down: migration_20260326_093705_add_airport_project.down,
    name: '20260326_093705_add_airport_project',
  },
  {
    up: migration_20260330_091321.up,
    down: migration_20260330_091321.down,
    name: '20260330_091321',
  },
  {
    up: migration_20260330_101549.up,
    down: migration_20260330_101549.down,
    name: '20260330_101549',
  },
  {
    up: migration_20260330_112900_sync_pages_notices_seo.up,
    down: migration_20260330_112900_sync_pages_notices_seo.down,
    name: '20260330_112900_sync_pages_notices_seo',
  },
  {
    up: migration_20260331_113831.up,
    down: migration_20260331_113831.down,
    name: '20260331_113831'
  },
  {
    up: migration_20260409_120000_news_events_documents.up,
    down: migration_20260409_120000_news_events_documents.down,
    name: '20260409_120000_news_events_documents'
  },
];
