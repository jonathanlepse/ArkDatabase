+------------------------------------------------------------------------------+
|******************************************************************************|
|****                                                                      ****|
|****                              READ ME                                 ****|
|****                                                                      ****|
|******************************************************************************|
+------------------------------------------------------------------------------+

+------------------------------------------------------------------------------+
|                            RUNNING THE SCRAPER                               |
+------------------------------------------------------------------------------+

cd /Users/emilchoski/Documents/App_Dev/ArkData/node/scraper/

DEBUG=scraper:* npm start

might be needed: npm install

+------------------------------------------------------------------------------+
|                       RUNNING THE CODIFICATION ADMIN                         |
+------------------------------------------------------------------------------+

cd /Users/emilchoski/Documents/App_Dev/ArkData/
python -m SimpleHTTPServer

+------------------------------------------------------------------------------+
|                SQL QUERIES (NOT USED IN LATEST IMPLEMENTATION)               |
+------------------------------------------------------------------------------+

=======================================
COUNTIES TABLE

CREATE TABLE counties (
 id int NOT NULL AUTO_INCREMENT,
 name varchar(100),
 PRIMARY KEY (id)
);

INSERT INTO counties (id, name) VALUES
(1, "Nassau"),
(2, "Suffolk")

=======================================
MUNICIPALITY TABLE

CREATE TABLE municipalities (
 id int NOT NULL AUTO_INCREMENT,
 name varchar(100),
 url varchar(255),
 county_id int,
 updated_on datetime,
 PRIMARY KEY (id),
 FOREIGN KEY (county_id) REFERENCES counties(id)
)

=======================================
SECTION TABLE

CREATE TABLE sections (
 id int NOT NULL AUTO_INCREMENT,
 para varchar(255),
 title varchar(255),
 body text,
 url varchar(255),
 parent_id int,
 municipality_id int,
 PRIMARY KEY (id),
 FOREIGN KEY (parent_id) REFERENCES sections(id)
)

=======================================
TRUNCATE TABLES
(deletes rows, but keeps table)

TRUNCATE TABLE counties;
TRUNCATE TABLE municipalities;
TRUNCATE TABLE sections;

=======================================
DROP TABLES

DROP TABLE counties;
DROP TABLE municipalities;
DROP TABLE sections;

=======================================
QUERIES

SELECT * FROM sections;
SELECT * FROM sections WHERE body like '%setback%';


=======================================
