
//הרצנו את הקוד הבא ליצירת הטבלאות 
    CREATE DATABASE IF NOT EXISTS project;
    USE project;

    DROP TABLE IF EXISTS constraints;
    DROP TABLE IF EXISTS users;
//טבלת משתמשים
REATE TABLE`users`(
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL UNIQUE,
  `password` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `is_kata` enum('yes', 'no') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'no',
    `degree` enum('ניהולמ"ע', 'מדמ"ח', 'פוליטיקה') COLLATE utf8mb4_general_ci DEFAULT NULL,
      `hours` int DEFAULT '0',
        PRIMARY KEY(`id`),
          UNIQUE KEY`email`(`email`)
) ENGINE = InnoDB AUTO_INCREMENT = 8 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci     //כדי שנוכל להשתמש בעברית

//טבלת אילוצים
CREATE TABLE constraints(
            id int NOT NULL AUTO_INCREMENT,
            full_name varchar(255) DEFAULT NULL,
            day_of_week enum('sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat') NOT NULL,
              degree enum('ניהולמ"ע', 'מדמ"ח', 'פוליטיקה') NOT NULL,
                start_time time NOT NULL,
                  end_time time NOT NULL,
                    PRIMARY KEY(id),
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;


//טבלת שיבץ, מתעדכנת כל שבוע
CREATE TABLE schedule(
                      id int NOT NULL AUTO_INCREMENT,
                      day_of_week enum('sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat') NOT NULL,
                        start_time time NOT NULL,
                          student_name varchar(255) NOT NULL,
                            PRIMARY KEY(id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
