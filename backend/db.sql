-- MySQL dump 10.13  Distrib 8.0.34, for Win64 (x86_64)
--
-- Host: localhost    Database: saidicdo_db
-- ------------------------------------------------------
-- Server version	8.0.35

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `alarms`
--

DROP TABLE IF EXISTS `alarms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alarms` (
  `ida` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `msg` text NOT NULL,
  `type` enum('recordatorio','información','aviso') NOT NULL,
  `startdate` datetime NOT NULL,
  `endingdate` datetime DEFAULT NULL,
  `daysinterval` int DEFAULT '1',
  `scope_type` enum('self','municipio','provincia','global','rol') NOT NULL,
  `scope_valor` varchar(50) DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `username` varchar(15) NOT NULL,
  PRIMARY KEY (`ida`),
  KEY `idx_user` (`username`),
  KEY `idx_scope` (`scope_type`,`scope_valor`),
  KEY `idx_programacion` (`startdate`,`endingdate`)
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alarms`
--

LOCK TABLES `alarms` WRITE;
/*!40000 ALTER TABLE `alarms` DISABLE KEYS */;
/*!40000 ALTER TABLE `alarms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `alarms_users`
--

DROP TABLE IF EXISTS `alarms_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alarms_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `alarms_ida` int NOT NULL,
  `userid` varchar(15) NOT NULL,
  `scheduledate` datetime NOT NULL,
  `read` tinyint(1) DEFAULT '0',
  `readdate` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_alarm` (`alarms_ida`,`userid`),
  KEY `idx_user` (`userid`),
  KEY `idx_alarms` (`alarms_ida`),
  KEY `idx_leida` (`read`),
  KEY `idx_programada` (`scheduledate`),
  CONSTRAINT `fk_alarm_instancia` FOREIGN KEY (`alarms_ida`) REFERENCES `alarms` (`ida`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_instancia` FOREIGN KEY (`userid`) REFERENCES `users` (`userid`)
) ENGINE=InnoDB AUTO_INCREMENT=4254 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alarms_users`
--

LOCK TABLES `alarms_users` WRITE;
/*!40000 ALTER TABLE `alarms_users` DISABLE KEYS */;
/*!40000 ALTER TABLE `alarms_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_event`
--

DROP TABLE IF EXISTS `audit_event`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_event` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `actor_type` enum('USER','SYSTEM') NOT NULL,
  `actor_id` varchar(15) DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `entity` varchar(50) NOT NULL,
  `entity_id` varchar(50) DEFAULT NULL,
  `description` text NOT NULL,
  `old_state` json DEFAULT NULL,
  `new_state` json DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_event`
--

LOCK TABLES `audit_event` WRITE;
/*!40000 ALTER TABLE `audit_event` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_event` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_log`
--

DROP TABLE IF EXISTS `audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(15) DEFAULT NULL,
  `ip` varchar(50) DEFAULT NULL,
  `action` varchar(20) DEFAULT NULL,
  `table_name` varchar(25) DEFAULT NULL,
  `record_id` varchar(15) DEFAULT NULL,
  `query_text` text,
  `extra_data` json DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_log`
--

LOCK TABLES `audit_log` WRITE;
/*!40000 ALTER TABLE `audit_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auxmoreuserpermissions`
--

DROP TABLE IF EXISTS `auxmoreuserpermissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auxmoreuserpermissions` (
  `userid` varchar(15) NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`userid`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `auxmoreuserpermissions_ibfk_1` FOREIGN KEY (`userid`) REFERENCES `users` (`userid`),
  CONSTRAINT `auxmoreuserpermissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `auxpermissions` (`idp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auxmoreuserpermissions`
--

LOCK TABLES `auxmoreuserpermissions` WRITE;
/*!40000 ALTER TABLE `auxmoreuserpermissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auxmoreuserpermissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auxmrrppedagogy`
--

DROP TABLE IF EXISTS `auxmrrppedagogy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auxmrrppedagogy` (
  `auxmrrp` int NOT NULL AUTO_INCREMENT,
  `id` int NOT NULL,
  `schoolgrade` int NOT NULL,
  `communication` text,
  `relationship` text,
  `motorskills` text,
  `spanishlanguage` text,
  `math` text,
  `history` text,
  `savedate` date NOT NULL,
  `username` varchar(15) NOT NULL,
  PRIMARY KEY (`auxmrrp`),
  KEY `fk_auxmrrppedagogy_users` (`username`),
  KEY `fk_auxmrrppedagogy_mgivar` (`id`),
  CONSTRAINT `fk_auxmrrppedagogy_mgivar` FOREIGN KEY (`id`) REFERENCES `mgivar` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_auxmrrppedagogy_users` FOREIGN KEY (`username`) REFERENCES `users` (`userid`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auxmrrppedagogy`
--

LOCK TABLES `auxmrrppedagogy` WRITE;
/*!40000 ALTER TABLE `auxmrrppedagogy` DISABLE KEYS */;
/*!40000 ALTER TABLE `auxmrrppedagogy` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auxpermissions`
--

DROP TABLE IF EXISTS `auxpermissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auxpermissions` (
  `idp` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  `resource` varchar(45) NOT NULL,
  `tooltip` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`idp`)
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auxpermissions`
--

LOCK TABLES `auxpermissions` WRITE;
/*!40000 ALTER TABLE `auxpermissions` DISABLE KEYS */;
INSERT INTO `auxpermissions` VALUES (31,'sujeto_solicitar','sujeto','Permite el envío de una solicitud para uno o varios niños sean atendidos por el corresponiente CDO.'),(32,'sujeto_estudiar','sujeto','Permite sleccionar un sujeto y empezar un estudio o continuar, si el usuario ya lo había comenzado.'),(33,'sujeto_editar_listado_provincia','sujeto','Permite cerrar un estudio inconcluso a un sujeto'),(34,'sujeto_continuar_estudio','sujeto','Permite que un usuario pueda continuar un estudio que él nop inició.'),(35,'sujeto_ver_listado_cdo','sujeto','Permite ver listado de todos los sujetos atendidos por el CDO.'),(36,'sujeto_editar_listado_cdo','sujeto','Permite editar sujetos y estudios relacionados de un CDO.'),(37,'sujeto_editar_nivel_nacional','sujeto','Permite editar sujetos y estudios de cualquier CDO del país.'),(38,'bd_backup','bd','Permite hacer una salva de la base de datos. Si es un supevisor se hará solo con los datos pertenecientes a los CDO de esa provincia.'),(39,'bd_vaciar','bd','Permite vaciar (borrar) todos los datos de la base de datos.'),(40,'auditar_trazas','auditar','Permite ver las trazas dejadas por los usuarios cuando han trabajado con la aplicación.'),(41,'borrar_trazas','auditar','Permite hacer una salva de las trazas antes de borrarlas.'),(42,'usuario_registrarse','usuario','Permite que cualquier persona pueda registrarse.'),(43,'usuario_editar','usuario','Permite aprobar el registro de un usuario.'),(45,'usuario_ver','usuario','Permite ver todos los usuarios y sus datos. La infomación se restringirá a una provincia si se es supervisor.'),(46,'sujeto_ver_listado_provincia','sujeto','Permite configurar un rol atípico para un usuario, con permisos restringidos o aumentados.'),(47,'sujeto_ver_listado_nivel_nacional','sujeto','Permite asignarle este rol a un usuario personalizado.'),(48,'sujeto_editar_listado_provincia','sujeto','Permite asignarle este rol a un usuario personalizado'),(49,'alarma_administrar','alarma','Permite asignarle este rol a un usuario personalizado'),(50,'acceso_tablero_control','otros','acceso a;l tablero de control'),(51,'estadistica_cdo','estadistica','Permite ver y analizar las estadísticas a nivel de CDO.'),(52,'estadistica_provincia','estadistica','Permite ver y analizar las estadísticas de todos los CDO de una provincia.'),(53,'estadistica_nacion','estadistica','Permite ver y analizar las estadísticas de todos los CDO del país en su conjunto.'),(54,'alarma_propia','alarma','Permite al usuario definir sus propias alarmas.'),(55,'alarma_cdo','alarma','Permite definir alarmas para todos los usuarios de un CDO.'),(56,'alarma_provincia','alarma','Permite definir alarmas para todos los usuarios de todos los CDO de una provincia.'),(57,'alarma_nacion','alarma','Permite definir alarmas para todos los usuarios de todos los CDO del país.'),(58,'alarma_superv','alarma','Permite definir alarmas dirigida solo a los supervisores.'),(59,'alarma_admin','alarma','Permite definir alarmas dirigida solo a los administradores.'),(60,'encuestas','otros','Permite crear y enviar encuestas.');
/*!40000 ALTER TABLE `auxpermissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auxrols`
--

DROP TABLE IF EXISTS `auxrols`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auxrols` (
  `idr` int NOT NULL AUTO_INCREMENT,
  `name` enum('tutor','teacher','user','superv','admin','superadmin','userextra') NOT NULL,
  `description` text,
  PRIMARY KEY (`idr`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auxrols`
--

LOCK TABLES `auxrols` WRITE;
/*!40000 ALTER TABLE `auxrols` DISABLE KEYS */;
INSERT INTO `auxrols` VALUES (1,'tutor','Solicitar que se evalúen niños bajo su cuidado, llenando un formulario con los datos relevantes para que el CDO decida cuándo y dónde atenderlos'),(2,'teacher','Solicitar que se evalúen niños bajo su cuidado, llenando un formulario con los datos relevantes para que el CDO decida cuándo y dónde atenderlos'),(3,'user','Registrarse libremente, pero la aprobación del registro será decisión del superv, admin o superadmin'),(4,'superv','Autorizar el registro a los usuarios de todos los CDO de la provincia.'),(5,'admin','No tendrá ninguna restricción salvo que no podrá asignar el rol de admin a otro usuario.'),(6,'superadmin','No tendrá ninguna restricción salvo que no podrá borrar la base de datos de un cliente ni las trazas.'),(7,'userextra','Permisos de usuario, pero podra very analizar datos de sujetos pertenecientes a su CDO que no haya atendido');
/*!40000 ALTER TABLE `auxrols` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auxrolspermissions`
--

DROP TABLE IF EXISTS `auxrolspermissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auxrolspermissions` (
  `rol_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`rol_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `auxrolspermissions_ibfk_1` FOREIGN KEY (`rol_id`) REFERENCES `auxrols` (`idr`),
  CONSTRAINT `auxrolspermissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `auxpermissions` (`idp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auxrolspermissions`
--

LOCK TABLES `auxrolspermissions` WRITE;
/*!40000 ALTER TABLE `auxrolspermissions` DISABLE KEYS */;
INSERT INTO `auxrolspermissions` VALUES (1,31),(2,31),(4,31),(5,31),(6,31),(3,32),(4,32),(5,32),(6,32),(7,32),(4,33),(5,33),(6,33),(4,34),(5,34),(6,34),(4,35),(5,35),(6,35),(4,36),(5,36),(6,36),(5,37),(6,37),(4,38),(5,38),(6,38),(5,39),(6,39),(4,40),(5,40),(6,40),(5,41),(6,41),(3,42),(4,42),(5,42),(6,42),(7,42),(4,43),(5,43),(6,43),(4,45),(5,45),(6,45),(4,46),(5,46),(6,46),(5,47),(6,47),(4,49),(5,49),(6,49),(4,50),(5,50),(6,50),(3,51),(4,51),(5,51),(6,51),(7,51),(4,52),(5,52),(6,52),(5,53),(6,53),(3,54),(4,54),(5,54),(6,54),(7,54),(4,55),(5,55),(6,55),(4,56),(5,56),(6,56),(5,57),(6,57),(5,58),(6,58),(5,59),(6,59),(3,60),(4,60),(5,60),(6,60),(7,60);
/*!40000 ALTER TABLE `auxrolspermissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auxselectedtests`
--

DROP TABLE IF EXISTS `auxselectedtests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auxselectedtests` (
  `idst` int NOT NULL AUTO_INCREMENT,
  `idme34` int NOT NULL,
  `testid` int NOT NULL,
  `date` date NOT NULL,
  `explanation` text,
  PRIMARY KEY (`idst`),
  UNIQUE KEY `uk_me34_test` (`idme34`,`testid`),
  KEY `fk_auxselectedtests_auxtests` (`testid`),
  CONSTRAINT `fk_auxselectedtests_auxtests` FOREIGN KEY (`testid`) REFERENCES `auxtests` (`testid`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_auxselectedtests_me3_4` FOREIGN KEY (`idme34`) REFERENCES `me3_4` (`idme34`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=83 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auxselectedtests`
--

LOCK TABLES `auxselectedtests` WRITE;
/*!40000 ALTER TABLE `auxselectedtests` DISABLE KEYS */;
/*!40000 ALTER TABLE `auxselectedtests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auxtests`
--

DROP TABLE IF EXISTS `auxtests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auxtests` (
  `testid` int NOT NULL AUTO_INCREMENT,
  `testname` varchar(255) NOT NULL,
  `testarea` varchar(45) NOT NULL,
  PRIMARY KEY (`testid`)
) ENGINE=InnoDB AUTO_INCREMENT=406 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auxtests`
--

LOCK TABLES `auxtests` WRITE;
/*!40000 ALTER TABLE `auxtests` DISABLE KEYS */;
INSERT INTO `auxtests` VALUES (125,'Cálculo de Kraepelín\r','psicologia'),(126,'Cubos de Kosh\r','psicologia'),(127,'Aprendizaje de diez de palabras\r','psicologia'),(128,'Pictograma\r','psicologia'),(129,'Comprensión de secuencia de láminas\r','psicologia'),(130,'Reproducción de relatos \r','psicologia'),(131,'Interpretación de refranes y metáforas\r','psicologia'),(132,'Formación de conceptos\r','psicologia'),(133,'Relaciones entre conceptos\r','psicologia'),(134,'Comparación de conceptos por semejanzas.\r','psicologia'),(135,'Comparación de conceptos por semejanzas y diferencias.\r','psicologia'),(136,'Relaciones lógicas entre conceptos (sinónimos y antónimos)\r','psicologia'),(137,'Exclusiones lógicas (1/4 excluido)\r','psicologia'),(138,'Clasificación de objetos\r','psicologia'),(139,'Clasificación de figuras geométricas.\r','psicologia'),(140,'Tablero de Seguin\r','psicologia'),(141,'Rompecabezas\r','psicologia'),(142,'Secuencias de láminas\r','psicologia'),(143,'Analogías simples\r','psicologia'),(144,'Analogías complejas\r','psicologia'),(145,'Completamiento de frases\r','psicologia'),(146,'Composición\r','psicologia'),(147,'Técnica de los diez deseos\r','psicologia'),(148,'Inventario de problemas juveniles\r','psicologia'),(149,'Tres ronas, tres deseos y tres miedos\r','psicologia'),(150,'Historietas de M Thomas.\r','psicologia'),(151,'EDEPSIM\r','neurocognitiva'),(152,'Numeracy Screener (4 a 6 años)\r','neurocognitiva'),(153,'Numerical Screener preescolar (4 a 6 años)\r','neurocognitiva'),(154,'Cuestionario de Ansiedad hacia las Matemáticas\r','neurocognitiva'),(155,'Cuestionatio de Ansiedad visuoespacial\r','neurocognitiva'),(156,'Cuestionario de Ambiente del Hogar para Niños en Preescolar\r','neurocognitiva'),(157,'Evaluación de estrategias de Aprendizaje Activo:\r','neurocognitiva'),(158,'Juego “20 preguntas”\r','neurocognitiva'),(159,'Juego “Toma llega tarde”\r','neurocognitiva'),(160,'Juego “Cerdos”\r','neurocognitiva'),(161,'Juego “Redes”\r','neurocognitiva'),(162,'Juego “Monster Top Trumps (MTT)”\r','neurocognitiva'),(163,'OptimA Evaluación\r','neurocognitiva'),(164,'OptimA Pesquisa\r','neurocognitiva'),(165,'Brunet Lezine: Coeficiente de nivel de desarrollo\r','psicometria'),(166,'Merrill Palmer: Evaluación global del desarrollo infantil (5 áreas: cognitivo, lenguaje, motor, socioemocional, conductas adaptativas)\r','psicometria'),(167,'Terman Merrill: Coeficiente de Inteligencia \r','psicometria'),(168,'NEMI: Coeficiente de Inteligencia\r','psicometria'),(169,'Terman Hayes: (Adaptación del Terman Binet para ciegos), Coeficiente de Inteligencia\r','psicometria'),(170,'Dibujo Libre: Personalidad del sujeto\r','psicometria'),(171,'Dibujo de la Familia: Estado emocional del niño\r','psicometria'),(172,'WIPSI: Funcionamiento Intelectual (2-7 años)\r','psicometria'),(173,'WISC: Coeficiente Intelectual (5 a 15 años)\r','psicometria'),(174,'WAIS: Coeficiente Intelectual (adulto)\r','psicometria'),(175,'Raven Infantil: Coeficiente Intelectual (5 a 11 años)\r','psicometria'),(176,'Raven Adultos: Coeficiente Intelectual (12 a 65 años)\r','psicometria'),(177,'Godenouch: Coeficiente Intelectual\r','psicometria'),(178,'Ozeretski: Psicomotricidad Global y Analítica (4 a 16 años)\r','psicometria'),(179,'Bender: Organicidad y Personalidad\r','psicometria'),(180,'Gracer Arthur: Coeficiente Intelectual\r','psicometria'),(181,'HTP: Rasgos de la personalidad en niños y adultos\r','psicometria'),(182,'Dominó: Coeficiente Intelectual\r','psicometria'),(183,'Weil: Coeficiente Intelectual\r','psicometria'),(184,'Machover: Personalidad\r','psicometria'),(185,'Test ABC\r','psicopedagogia'),(186,'Test Crespo\r','psicopedagogia'),(187,'Lateralidad\r','psicopedagogia'),(188,'Lectura\r','lengua'),(189,'Comprensión lectora\r','lengua'),(190,'Expresión oral\r','lengua'),(191,'Expresión escrita\r','lengua'),(192,'Ortografía\r','lengua'),(193,'Gramática\r','lengua'),(194,'Dominio numérico\r','math'),(195,'Cálculo\r','math'),(196,'Resolución de problemas\r','math'),(197,'Formulación de problemas\r','math'),(198,'Trabajo con magnitudes\r','math'),(199,'Trabajo con variables\r','math'),(200,'Trabajo con ecuaciones, \r','math'),(201,'Trabajo con inecuaciones \r','math'),(202,'Trabajo con sistemas de ecuaciones e inecuaciones \r','math'),(203,'\"Correspondencias y funciones\"\r','math'),(204,'Geometría  \r','math'),(205,'Trigonometría\r','math'),(206,'Combinatoria y probabilidades \r','math'),(207,'Tratamiento de datos/estadística\r','math'),(380,'Describir figuras históricas','historia'),(381,'Describir hechos históricos','historia'),(382,'Identificar figuras históricas ','historia'),(383,'Identificar hechos históricos','historia'),(384,'Narrar figuras históricas','historia'),(385,'Narrar hechos históricos','historia'),(386,'Valorar hechos históricos','historia'),(387,'Valorar figuras históricas','historia'),(388,'Ordenar fechas de hechos históricos','historia'),(389,'Caracterizar figuras históricas','historia'),(390,'Explicar hechos históricos','historia'),(391,'Argumentar','historia'),(392,'Ejemplificar','historia'),(393,'Memorizar','historia'),(394,'Descripción','logopedia'),(395,'Conversación','logopedia'),(396,'Observación','logopedia'),(397,'Imitación','logopedia'),(398,'Cumplir órdenes de diferentes niveles complejidad','logopedia'),(399,'Juegos de encaje','logopedia'),(400,'Reproducción de modelos','logopedia'),(401,'Hoja de Exploración Logopédica','logopedia'),(402,'Otras','logopedia'),(403,'Comunicación','pedagogia'),(404,'Relación con el entorno','pedagogia'),(405,'Motricidad','pedagogia');
/*!40000 ALTER TABLE `auxtests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auxusersalarms`
--

DROP TABLE IF EXISTS `auxusersalarms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auxusersalarms` (
  `ida` int NOT NULL,
  `userid` varchar(15) NOT NULL,
  PRIMARY KEY (`ida`,`userid`),
  KEY `userid` (`userid`),
  CONSTRAINT `auxusersalarms_ibfk_2` FOREIGN KEY (`userid`) REFERENCES `users` (`userid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auxusersalarms`
--

LOCK TABLES `auxusersalarms` WRITE;
/*!40000 ALTER TABLE `auxusersalarms` DISABLE KEYS */;
/*!40000 ALTER TABLE `auxusersalarms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auxusersrol`
--

DROP TABLE IF EXISTS `auxusersrol`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auxusersrol` (
  `userid` varchar(15) NOT NULL,
  `rol_id` int NOT NULL,
  PRIMARY KEY (`userid`,`rol_id`),
  KEY `rol_id` (`rol_id`),
  CONSTRAINT `auxusersrol_ibfk_1` FOREIGN KEY (`userid`) REFERENCES `users` (`userid`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `auxusersrol_ibfk_2` FOREIGN KEY (`rol_id`) REFERENCES `auxrols` (`idr`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auxusersrol`
--

LOCK TABLES `auxusersrol` WRITE;
/*!40000 ALTER TABLE `auxusersrol` DISABLE KEYS */;
/*!40000 ALTER TABLE `auxusersrol` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `me3_1_1`
--

DROP TABLE IF EXISTS `me3_1_1`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `me3_1_1` (
  `idme31` int NOT NULL AUTO_INCREMENT,
  `id` int NOT NULL,
  `dni` varchar(15) NOT NULL,
  `reason` varchar(255) NOT NULL COMMENT 'Motivo de la atención',
  `anotherrreason` varchar(25) DEFAULT NULL COMMENT 'Otra Cuál?',
  `carepathway` varchar(25) NOT NULL COMMENT 'vía de atención',
  `concept` varchar(255) DEFAULT NULL COMMENT 'concepto por el que se atiende',
  `preschooldiagresults` varchar(25) NOT NULL COMMENT 'resultados diagnmóstico preescolar',
  `articulationstageresults` varchar(25) NOT NULL COMMENT 'resultados de etapas de articulación',
  `startdate` date NOT NULL COMMENT 'fecha de inicio',
  `directtreatment` varchar(255) NOT NULL COMMENT 'tratamiento directo',
  `canceldate` date NOT NULL COMMENT 'fecha de baja',
  `reasoncancel` varchar(25) NOT NULL COMMENT 'motivo de la baja',
  `transfer` varchar(25) DEFAULT NULL COMMENT 'traslado',
  `transferwhere` varchar(255) DEFAULT NULL COMMENT 'traslado a dónde',
  `teachertraining` varchar(30) NOT NULL COMMENT 'formación del maestro',
  `experience` varchar(25) NOT NULL COMMENT 'experiencia',
  `savedate` date NOT NULL,
  `username` varchar(15) NOT NULL,
  PRIMARY KEY (`idme31`),
  KEY `fk_me3_1_1_users` (`username`),
  KEY `fk_me3_1_1_mgivar` (`id`),
  CONSTRAINT `fk_me3_1_1_mgivar` FOREIGN KEY (`id`) REFERENCES `mgivar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_me3_1_1_users` FOREIGN KEY (`username`) REFERENCES `users` (`userid`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `me3_1_1`
--

LOCK TABLES `me3_1_1` WRITE;
/*!40000 ALTER TABLE `me3_1_1` DISABLE KEYS */;
/*!40000 ALTER TABLE `me3_1_1` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `me3_2_1`
--

DROP TABLE IF EXISTS `me3_2_1`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `me3_2_1` (
  `idme321` int NOT NULL AUTO_INCREMENT,
  `id` int NOT NULL,
  `dni` varchar(15) NOT NULL,
  `pregnancy` varchar(25) NOT NULL COMMENT 'Embarazo',
  `gesnumber` int NOT NULL COMMENT 'Número de orden de gestación',
  `abortions` tinyint NOT NULL COMMENT 'abortos',
  `abortionstypes` varchar(45) DEFAULT NULL COMMENT 'tipos de abortos',
  `abortionsquantity` int DEFAULT NULL COMMENT 'cantidad de abortos',
  `toxichabits` tinyint NOT NULL COMMENT 'hábitos tóxicos?',
  `toxichabitstypes` varchar(255) DEFAULT NULL COMMENT 'Cuáles?',
  `motherfetusbloodcomp` tinyint NOT NULL COMMENT 'Compatibilidad sanguínea madre-feto',
  `motherfatherconsanguinity` tinyint NOT NULL COMMENT 'Consanguinidad madre-padre',
  `bleeding` tinyint NOT NULL COMMENT 'Sangramiento',
  `illnessespregnancy` tinyint NOT NULL COMMENT 'Enfermedades durante el embarazo',
  `illnesses` varchar(255) DEFAULT NULL COMMENT 'Cuáles?',
  `childbirthtypes` varchar(255) NOT NULL COMMENT 'Tipo de parto',
  `complications` varchar(25) NOT NULL COMMENT 'complicaciones',
  `breastfeedinguntil` varchar(15) NOT NULL COMMENT 'Lactancia materna única hasta',
  `savedate` date NOT NULL,
  `username` varchar(15) NOT NULL,
  PRIMARY KEY (`idme321`),
  KEY `fk_me3_2_1_users` (`username`),
  KEY `fk_me3_2_1_mgivar` (`id`),
  CONSTRAINT `fk_me3_2_1_mgivar` FOREIGN KEY (`id`) REFERENCES `mgivar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_me3_2_1_users` FOREIGN KEY (`username`) REFERENCES `users` (`userid`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `me3_2_1`
--

LOCK TABLES `me3_2_1` WRITE;
/*!40000 ALTER TABLE `me3_2_1` DISABLE KEYS */;
/*!40000 ALTER TABLE `me3_2_1` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `me3_2_2`
--

DROP TABLE IF EXISTS `me3_2_2`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `me3_2_2` (
  `idme322` int NOT NULL AUTO_INCREMENT,
  `id` int NOT NULL,
  `dni` varchar(15) NOT NULL,
  `validism` varchar(25) NOT NULL COMMENT 'Validismo',
  `analsphinctercontrol` varchar(25) NOT NULL COMMENT 'Control esfínter anal',
  `bladdersphinctercontrol` varchar(25) NOT NULL COMMENT 'Control esfínter vesical',
  `diseasessuffered` varchar(255) NOT NULL COMMENT 'enfermedades padecidas',
  `traumasaccidents` varchar(255) NOT NULL COMMENT '\nTraumas por accidentes',
  `medications` varchar(255) NOT NULL,
  `communication` int NOT NULL COMMENT 'comunicación',
  `selfcare` int NOT NULL COMMENT 'Autocuidado',
  `homelife` int NOT NULL COMMENT 'Vida en el hogar',
  `socialskills` int NOT NULL COMMENT 'Habilidades soc',
  `communityuse` int NOT NULL COMMENT 'Uso comunidad',
  `selfdirection` int NOT NULL COMMENT 'Autodirección',
  `health` int NOT NULL COMMENT 'Autodirección',
  `leisure` int NOT NULL COMMENT 'Tiempo libre',
  `savedate` date NOT NULL,
  `username` varchar(15) NOT NULL,
  PRIMARY KEY (`idme322`),
  KEY `fk_me3_2_2_users` (`username`),
  KEY `fk_me3_2_2_mgivar` (`id`),
  CONSTRAINT `fk_me3_2_2_mgivar` FOREIGN KEY (`id`) REFERENCES `mgivar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_me3_2_2_users` FOREIGN KEY (`username`) REFERENCES `users` (`userid`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `me3_2_2`
--

LOCK TABLES `me3_2_2` WRITE;
/*!40000 ALTER TABLE `me3_2_2` DISABLE KEYS */;
/*!40000 ALTER TABLE `me3_2_2` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `me3_2_3`
--

DROP TABLE IF EXISTS `me3_2_3`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `me3_2_3` (
  `idme323` int NOT NULL AUTO_INCREMENT,
  `id` int NOT NULL,
  `dni` varchar(15) NOT NULL,
  `maternalfamilypathhistory` text NOT NULL COMMENT 'Antecedentes Patológicos Familiares - madre',
  `paternalfamilypathhistory` text NOT NULL COMMENT 'Antecedentes Patológicos Familiares - padre',
  `savedate` date NOT NULL,
  `username` varchar(15) NOT NULL,
  PRIMARY KEY (`idme323`),
  KEY `fk_me3_2_3_users` (`username`),
  KEY `fk_me3_2_3_mgivar` (`id`),
  CONSTRAINT `fk_me3_2_3_mgivar` FOREIGN KEY (`id`) REFERENCES `mgivar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_me3_2_3_users` FOREIGN KEY (`username`) REFERENCES `users` (`userid`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `me3_2_3`
--

LOCK TABLES `me3_2_3` WRITE;
/*!40000 ALTER TABLE `me3_2_3` DISABLE KEYS */;
/*!40000 ALTER TABLE `me3_2_3` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `me3_3_1`
--

DROP TABLE IF EXISTS `me3_3_1`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `me3_3_1` (
  `idme331` int NOT NULL AUTO_INCREMENT,
  `id` int NOT NULL,
  `dni` varchar(15) NOT NULL,
  `mother` tinyint NOT NULL,
  `father` tinyint NOT NULL,
  `maternalgrandmother` tinyint NOT NULL,
  `maternalgrandfather` tinyint NOT NULL,
  `paternalgrandmother` tinyint NOT NULL,
  `paternalgrandfather` tinyint NOT NULL,
  `brothers` int NOT NULL,
  `maternaluncles` int NOT NULL,
  `paternaluncles` int NOT NULL,
  `parentsrelationships` text NOT NULL COMMENT 'Relaciones entre los padres',
  `whichother` varchar(45) DEFAULT NULL COMMENT 'cual otra',
  `savedate` date NOT NULL,
  `username` varchar(15) NOT NULL,
  PRIMARY KEY (`idme331`),
  KEY `fk_me3_3_1_users` (`username`),
  KEY `fk_me3_3_1_mgivar` (`id`),
  CONSTRAINT `fk_me3_3_1_mgivar` FOREIGN KEY (`id`) REFERENCES `mgivar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_me3_3_1_users` FOREIGN KEY (`username`) REFERENCES `users` (`userid`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `me3_3_1`
--

LOCK TABLES `me3_3_1` WRITE;
/*!40000 ALTER TABLE `me3_3_1` DISABLE KEYS */;
/*!40000 ALTER TABLE `me3_3_1` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `me3_3_2`
--

DROP TABLE IF EXISTS `me3_3_2`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `me3_3_2` (
  `idme332` int NOT NULL AUTO_INCREMENT,
  `id` int NOT NULL,
  `dni` varchar(15) NOT NULL,
  `livingrooms` int NOT NULL,
  `bedrooms` int NOT NULL,
  `kitchen` int NOT NULL,
  `bathrooms` int NOT NULL,
  `constconditions` varchar(25) NOT NULL COMMENT 'Condiciones constructivas',
  `economicsituation` varchar(25) NOT NULL COMMENT 'Situación Económica',
  `savedate` date NOT NULL,
  `username` varchar(15) NOT NULL,
  PRIMARY KEY (`idme332`),
  KEY `fk_me3_3_2_users` (`username`),
  KEY `fk_me3_3_2_mgivar` (`id`),
  CONSTRAINT `fk_me3_3_2_mgivar` FOREIGN KEY (`id`) REFERENCES `mgivar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_me3_3_2_users` FOREIGN KEY (`username`) REFERENCES `users` (`userid`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `me3_3_2`
--

LOCK TABLES `me3_3_2` WRITE;
/*!40000 ALTER TABLE `me3_3_2` DISABLE KEYS */;
/*!40000 ALTER TABLE `me3_3_2` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `me3_3_3`
--

DROP TABLE IF EXISTS `me3_3_3`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `me3_3_3` (
  `idme333` int NOT NULL AUTO_INCREMENT,
  `id` int NOT NULL,
  `dni` varchar(15) NOT NULL,
  `f11` varchar(5) NOT NULL COMMENT 'Nivel de conocimiento sobre el nivel de desarrollo de sus hijos según la etapa del desarrollo',
  `f12` varchar(5) NOT NULL COMMENT 'Nivel de conocimiento de las particularidades de sus hijos',
  `f21` varchar(5) NOT NULL COMMENT 'Nivel de voluntad para elevar sus recursos cognitivos, afectivos y actitudinales',
  `f22` varchar(5) NOT NULL COMMENT 'Nivel de funcionamiento de roles',
  `f31` varchar(5) NOT NULL COMMENT 'Nivel de funcionamiento de comunicación intrafamiliar',
  `f32` varchar(5) NOT NULL COMMENT 'Nivel de funcionamiento de comunicación con los hijos',
  `f41` varchar(5) NOT NULL COMMENT 'Nivel de funcionamiento de los límites',
  `f42` varchar(5) NOT NULL COMMENT 'Nivel de funcionamiento de los métodos educativos',
  `f51` varchar(5) NOT NULL COMMENT 'Nivel de cumplimiento de las orientaciones de los especialistas',
  `f52` varchar(5) NOT NULL COMMENT 'Nivel de habilidades para ofrecer oportunamente la ayuda a sus hijos',
  `savedate` date NOT NULL,
  `username` varchar(15) NOT NULL,
  PRIMARY KEY (`idme333`),
  KEY `fk_me3_3_3_users` (`username`),
  KEY `fk_me3_3_3_mgivar` (`id`),
  CONSTRAINT `fk_me3_3_3_mgivar` FOREIGN KEY (`id`) REFERENCES `mgivar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_me3_3_3_users` FOREIGN KEY (`username`) REFERENCES `users` (`userid`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `me3_3_3`
--

LOCK TABLES `me3_3_3` WRITE;
/*!40000 ALTER TABLE `me3_3_3` DISABLE KEYS */;
/*!40000 ALTER TABLE `me3_3_3` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `me3_4`
--

DROP TABLE IF EXISTS `me3_4`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `me3_4` (
  `idme34` int NOT NULL AUTO_INCREMENT,
  `id` int NOT NULL,
  `dni` varchar(15) NOT NULL,
  `psychology` tinyint NOT NULL DEFAULT '0',
  `neurocognitive` tinyint NOT NULL DEFAULT '0',
  `psychometry` tinyint NOT NULL DEFAULT '0',
  `psychopedagogy` tinyint NOT NULL DEFAULT '0',
  `pedagogygeneral` tinyint NOT NULL DEFAULT '0',
  `pedagogylang` tinyint NOT NULL DEFAULT '0',
  `pedagogymath` tinyint NOT NULL DEFAULT '0',
  `pedagogyhistory` tinyint NOT NULL DEFAULT '0',
  `speechtherapy` tinyint DEFAULT NULL,
  `channel` varchar(20) NOT NULL,
  `rhythm` varchar(50) NOT NULL,
  `savedate` date NOT NULL,
  `username` varchar(15) NOT NULL,
  PRIMARY KEY (`idme34`),
  KEY `fk_me3_4_users` (`username`),
  KEY `fk_me3_4_mgivar` (`id`),
  CONSTRAINT `fk_me3_4_mgivar` FOREIGN KEY (`id`) REFERENCES `mgivar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_me3_4_users` FOREIGN KEY (`username`) REFERENCES `users` (`userid`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `me3_4`
--

LOCK TABLES `me3_4` WRITE;
/*!40000 ALTER TABLE `me3_4` DISABLE KEYS */;
/*!40000 ALTER TABLE `me3_4` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mgifixed`
--

DROP TABLE IF EXISTS `mgifixed`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mgifixed` (
  `dni` varchar(15) NOT NULL,
  `fullname` varchar(45) NOT NULL,
  `birthdate` date NOT NULL,
  `sex` varchar(1) NOT NULL,
  `skincolor` varchar(10) NOT NULL,
  `savedate` date NOT NULL,
  `photo` longblob,
  `username` varchar(15) NOT NULL,
  PRIMARY KEY (`dni`),
  UNIQUE KEY `dni_UNIQUE` (`dni`),
  KEY `fk_mgifixed_users` (`username`),
  CONSTRAINT `fk_mgifixed_users` FOREIGN KEY (`username`) REFERENCES `users` (`userid`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mgifixed`
--

LOCK TABLES `mgifixed` WRITE;
/*!40000 ALTER TABLE `mgifixed` DISABLE KEYS */;
/*!40000 ALTER TABLE `mgifixed` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mgivar`
--

DROP TABLE IF EXISTS `mgivar`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mgivar` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dni` varchar(15) NOT NULL,
  `cage` int NOT NULL,
  `mage` int NOT NULL,
  `address` varchar(255) NOT NULL,
  `province` varchar(20) NOT NULL,
  `municipality` varchar(40) NOT NULL,
  `councill` varchar(40) NOT NULL,
  `zone` varchar(10) NOT NULL,
  `personincharge` varchar(45) NOT NULL,
  `parentalrelationship` varchar(10) NOT NULL,
  `anotherrelation` varchar(20) DEFAULT NULL,
  `tel` varchar(20) DEFAULT NULL,
  `startdate` varchar(20) NOT NULL,
  `edulevel` varchar(25) NOT NULL,
  `degree` int NOT NULL,
  `eduinstitution` varchar(30) NOT NULL,
  `institution` varchar(25) DEFAULT NULL,
  `repetition` tinyint NOT NULL,
  `repetitioncount` varchar(20) DEFAULT NULL,
  `objovercome` tinyint DEFAULT NULL,
  `savedate` date NOT NULL,
  `username` varchar(15) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `dni_idx` (`dni`),
  KEY `fk_mgivar_users` (`username`),
  CONSTRAINT `fk_mgivar_users` FOREIGN KEY (`username`) REFERENCES `users` (`userid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1343 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mgivar`
--

LOCK TABLES `mgivar` WRITE;
/*!40000 ALTER TABLE `mgivar` DISABLE KEYS */;
/*!40000 ALTER TABLE `mgivar` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mrrp41`
--

DROP TABLE IF EXISTS `mrrp41`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mrrp41` (
  `idmrrp41` int NOT NULL AUTO_INCREMENT,
  `id` int NOT NULL,
  `dni` varchar(15) DEFAULT NULL,
  `psicopotential` text,
  `psiconeeds` text,
  `psicodiagimpression` text,
  `intelligencequotient` text,
  `devquotient` text,
  `psicomediagimpression` text,
  `psicopedpotential` text,
  `psicopedneeds` text,
  `psicopeddiagimpression` text,
  `speechtherapydiagnosis` text,
  `potential` text,
  `needs` text,
  `diagnosticresults` text,
  `savedate` date NOT NULL,
  `username` varchar(15) NOT NULL,
  PRIMARY KEY (`idmrrp41`),
  KEY `fk_mrrp41_users` (`username`),
  KEY `fk_mrrp41_mgivar` (`id`),
  CONSTRAINT `fk_mrrp41_mgivar` FOREIGN KEY (`id`) REFERENCES `mgivar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_mrrp41_users` FOREIGN KEY (`username`) REFERENCES `users` (`userid`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mrrp41`
--

LOCK TABLES `mrrp41` WRITE;
/*!40000 ALTER TABLE `mrrp41` DISABLE KEYS */;
/*!40000 ALTER TABLE `mrrp41` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mrrp42`
--

DROP TABLE IF EXISTS `mrrp42`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mrrp42` (
  `idmrrp42` int NOT NULL AUTO_INCREMENT,
  `id` int NOT NULL,
  `dni` varchar(15) NOT NULL,
  `filenumber` int NOT NULL,
  `caremodality` varchar(20) NOT NULL,
  `educationalinstitution` varchar(45) NOT NULL,
  `transit` varchar(15) NOT NULL,
  `egress` varchar(15) NOT NULL,
  `bond` varchar(15) NOT NULL,
  `employercenter` varchar(45) DEFAULT NULL,
  `savedate` date NOT NULL,
  `username` varchar(15) NOT NULL,
  PRIMARY KEY (`idmrrp42`),
  KEY `fk_posts_users` (`username`),
  KEY `fk_mrrp42_mgivar` (`id`),
  CONSTRAINT `fk_mrrp42_mgivar` FOREIGN KEY (`id`) REFERENCES `mgivar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_posts_users` FOREIGN KEY (`username`) REFERENCES `users` (`userid`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mrrp42`
--

LOCK TABLES `mrrp42` WRITE;
/*!40000 ALTER TABLE `mrrp42` DISABLE KEYS */;
/*!40000 ALTER TABLE `mrrp42` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mrrp43`
--

DROP TABLE IF EXISTS `mrrp43`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mrrp43` (
  `idmrrp43` int NOT NULL AUTO_INCREMENT,
  `id` int NOT NULL,
  `dni` varchar(15) NOT NULL,
  `username` varchar(15) NOT NULL,
  `savedate` date NOT NULL,
  PRIMARY KEY (`idmrrp43`),
  KEY `fk_mrrp43_users` (`username`),
  KEY `fk_mrrp43_mgivar` (`id`),
  CONSTRAINT `fk_mrrp43_mgivar` FOREIGN KEY (`id`) REFERENCES `mgivar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_mrrp43_users` FOREIGN KEY (`username`) REFERENCES `users` (`userid`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mrrp43`
--

LOCK TABLES `mrrp43` WRITE;
/*!40000 ALTER TABLE `mrrp43` DISABLE KEYS */;
/*!40000 ALTER TABLE `mrrp43` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mrrp44`
--

DROP TABLE IF EXISTS `mrrp44`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mrrp44` (
  `idmrrp44` int NOT NULL AUTO_INCREMENT,
  `id` int NOT NULL,
  `dni` varchar(15) NOT NULL,
  `username` varchar(15) NOT NULL,
  `savedate` date NOT NULL,
  PRIMARY KEY (`idmrrp44`),
  KEY `fk_mrrp44_users` (`username`),
  KEY `fk_mrrp44_mgivar` (`id`),
  CONSTRAINT `fk_mrrp44_mgivar` FOREIGN KEY (`id`) REFERENCES `mgivar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_mrrp44_users` FOREIGN KEY (`username`) REFERENCES `users` (`userid`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mrrp44`
--

LOCK TABLES `mrrp44` WRITE;
/*!40000 ALTER TABLE `mrrp44` DISABLE KEYS */;
/*!40000 ALTER TABLE `mrrp44` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pedagogy`
--

DROP TABLE IF EXISTS `pedagogy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedagogy` (
  `idme34` int NOT NULL,
  `communication` text,
  `relenvironment` text,
  `motorskills` text,
  `splangreading` text,
  `splangcomprehension` text,
  `splangoralexpression` text,
  `splangwrittenexpression` text,
  `splangspelling` text,
  `splanggrammar` text,
  `mathreasoning` text,
  `mathcalculus` text,
  `mathproblemsolvin` text,
  `mathproblemformulation` text,
  `mathmagnitudes` text,
  `mathvariables` text,
  `mathequations` text,
  `mathinequalities` text,
  `mathsystems` text,
  `mathfunctions` text,
  `mathgeometry` text,
  `mathtrigonometry` text,
  `mathprobability` text,
  `mathstatistics` text,
  `histdescribefigures` text,
  `histdescribeevents` text,
  `histidentifyfigures` text,
  `histidentifyevents` text,
  `histnarratefigures` text,
  `histnarrateevents` text,
  `histevaluateevents` text,
  `histevaluatefigures` text,
  `historderevents` text,
  `characterizefigures` text,
  `histexplainevents` text,
  `histarguments` text,
  `histexamples` text,
  `histmemorize` text,
  PRIMARY KEY (`idme34`),
  CONSTRAINT `fk_pedagogy_me3_4` FOREIGN KEY (`idme34`) REFERENCES `me3_4` (`idme34`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pedagogy`
--

LOCK TABLES `pedagogy` WRITE;
/*!40000 ALTER TABLE `pedagogy` DISABLE KEYS */;
/*!40000 ALTER TABLE `pedagogy` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `speechtherapy`
--

DROP TABLE IF EXISTS `speechtherapy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `speechtherapy` (
  `idme34` int NOT NULL,
  `observation` text,
  `imitation` text,
  `followinginstructions` text,
  `lacinggames` text,
  `modelreproduction` text,
  `speechsheet` text,
  `other` text,
  PRIMARY KEY (`idme34`),
  CONSTRAINT `fk_speechtherapy_me3_4` FOREIGN KEY (`idme34`) REFERENCES `me3_4` (`idme34`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `speechtherapy`
--

LOCK TABLES `speechtherapy` WRITE;
/*!40000 ALTER TABLE `speechtherapy` DISABLE KEYS */;
/*!40000 ALTER TABLE `speechtherapy` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `userid` varchar(15) NOT NULL,
  `userpass` varchar(255) NOT NULL,
  `useremail` varchar(100) NOT NULL,
  `userspec` enum('Ninguno','Psicología','Psicopedagogía','Logopedia','Psicometría','Pedagogía') NOT NULL,
  `active` tinyint NOT NULL DEFAULT '0',
  `registeredpend` tinyint NOT NULL DEFAULT '1',
  `fullname` varchar(45) NOT NULL,
  `municipality` varchar(45) NOT NULL,
  `province` varchar(45) NOT NULL,
  PRIMARY KEY (`userid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-09 20:07:54
