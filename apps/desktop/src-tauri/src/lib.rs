use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "outstanding_valkyrie",
            sql: include_str!("../../../../packages/core/migrations/0000_outstanding_valkyrie.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "cloudy_frog_thor",
            sql: include_str!("../../../../packages/core/migrations/0001_cloudy_frog_thor.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "gigantic_masque",
            sql: include_str!("../../../../packages/core/migrations/0002_gigantic_masque.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "groovy_robbie_robertson",
            sql: include_str!(
                "../../../../packages/core/migrations/0003_groovy_robbie_robertson.sql"
            ),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "groovy_human_cannonball",
            sql: include_str!(
                "../../../../packages/core/migrations/0004_groovy_human_cannonball.sql"
            ),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 6,
            description: "cynical_sleeper",
            sql: include_str!("../../../../packages/core/migrations/0005_cynical_sleeper.sql"),
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:tpt-agriculture.db", migrations)
                .build(),
        )
        .setup(|app| {
            let salt_path = app
                .path()
                .app_local_data_dir()
                .expect("could not resolve app local data dir")
                .join("stronghold-salt.txt");
            app.handle()
                .plugin(tauri_plugin_stronghold::Builder::with_argon2(&salt_path).build())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
