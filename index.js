#!/usr/bin/env node
/*----------------------------------------------------------------------------------------
* Hoody
*----------------------------------------------------------------------------------------
* Exemple d'utilisation : 
* 
* mkdir doc-project
* cd doc-project
* hoody init
* hoody run
* hoody deploy
*----------------------------------------------------------------------------------------*/

const express = require("express")
const fs = require("fs-extra")
const inquirer = require("inquirer")

const app = express()
const argv = process.argv.slice(2)

const LOCAL_USER_PATH = process.env.PWD
const PREF_FILE = process.env.PWD + "/config.json"
const MSG_ERR = "Appel incorrect de Hoody"

const EXIT_BAD_SYNTAX = 1
const EXIT_WWW_NOT_FOUND = 2

// objet par défaut pour ssh-deployer
const SSH_DEPLOYER_DEFAULT = {
  localPath: process.env.PWD,
  currentReleaseLink: "htdocs",
  exclude: [".svn/**", ".git/**"]
}


// Lancement du traitement principal
main()

function main() {
  if (!argv[0]) {
    console.log(MSG_ERR)
    help()
    process.exit(EXIT_BAD_SYNTAX)
  }

  switch (argv[0].toUpperCase()) {
    case "INIT":
      init()
      break
    case "RUN":
      run()
      break
    case "DEPLOY":
      deploy()
      break
    default:
      console.log(MSG_ERR)
      help()
      process.exit(EXIT_BAD_SYNTAX)
  }
}

function help() {
  console.log("Hoody version 1.0.0")
  console.log("Syntaxe :")
  console.log("hoody init")
  console.log("hoody run")
  console.log("hoody deploy")
}

function init() {
  console.log("dans init")
  fs.stat(PREF_FILE)
    .then(() => {
      console.log(`Fichier des préférences ${PREF_FILE} trouvé`)
      console.log("Faire un hoody run ou hoody deploy pour continuer")

    })
    .catch(err => {
      // si fichier config.json inexistant, création en posant des questions
      console.log(`Le fichier ${PREF_FILE} n'existe pas`)

      askPreferences()
        .then(() => {
          // copie du fichier index.html et index.md du répertoire template dans le répertoire courant
          copyTemplate()
        })

    })
}

function askPreferences() {
  console.log("\n")

  return inquirer.prompt([{
    name: "host",
    message: "Adresse du serveur (nom DNS ou adresse IP)",
    default: "venezia.appli.dgfip",
    validate: input => {
      //console.log("answers", JSON.stringify(answers))
      return input ? true : "Le nom du serveur ne peut être vide"
    }
  },
  {
    name: "port",
    message: "Port du serveur (défaut: 9222)",
    default: "9222"
  },
  {
    name: "deployPath",
    message: "Répertoire distant à utiliser pour le déploiement",
    default: "/var/lib/gforge/chroot/home/groups/smartphone/",
    validate: input => {
      //console.log("answers", JSON.stringify(answers))
      return input ? true : "Le nom du serveur ne peut être vide"
    }
  },
  {
    name: "authType",
    message: "Par quel moyen voulez-vous vous identifier?",
    type: "list",
    choices: ["Nom/mot de passe", "Fichier de clé privé"]
  },
  {
    name: "username",
    message: "Utilisateur Venezia : ",
    when: function (answers) {
      return answers.authType === "Nom/mot de passe"
    },
    validate: input => {
      return input ? true : "L'utilisateur Venezia ne peut pas être vide"
    }
  }, {
    name: "password",
    message: "Mot de passe Venezia : ",
    type: "password",
    mask: "*",
    when: function (answers) {
      return answers.authType === "Nom/mot de passe"
    },
    validate: input => {
      return input ? true : "Le mot de passe ne peut pas être vide"
    }
  }, {
    name: "privateKeyFile",
    message: "Chemin vers votre clé privée",
    when: function (answers) {
      return answers.authType !== "Nom/mot de passe"
    },
    validate: input => {
      return input ? true : "Le chemin vers votre clé privée ne peut pas être vide"
    }
  }, {
    name: "privateKeyPassphrase",
    message: "Passphrase pour votre clé privée (optionnel)",
    when: function (answers) {
      return answers.authType !== "Nom/mot de passe"
    }
  }]).then(answers => {

    const answersCompleted = Object.assign({}, SSH_DEPLOYER_DEFAULT, answers)
    fs.writeFileSync(PREF_FILE, JSON.stringify(answersCompleted, null, "\t"))
  }).catch(err => {
    console.error(`\nErreur pour écrire le fichier ${PREF_FILE}. \nVeuillez vérifier les permissions sur le fichier.`)
  })
}

function copyTemplate() {

  fs.stat(LOCAL_USER_PATH + "/www")
    .then(() => {
      console.log("Le répertoire www existe déjà")
    })
    .catch(err => {
      console.log("Le répertoire www n'existe pas")
      fs.mkdir(LOCAL_USER_PATH + "/www")
        .then(() => {
          console.log("Répertoire www créé")
          return fs.copy(__dirname + "/template/", LOCAL_USER_PATH + "/www/")
        })
        .then(() => {
          console.log("Répertoire template copié")
        })
        .catch(err => {
          console.error("Erreur lors de la copie du répertoire template", err)
        })
    })
}

function run() {

  fs.stat(process.env.PWD + "/www/")
    .then(() => {
      app.use(express.static(process.env.PWD + "/www"))

      app.listen(8080, () => {
        console.log("serveur lancé sur http://localhost:8080")
      })
    })
    .catch(err => {
      console.error("Le répertoire www n'existe pas dans le répetoire courant. \n Veuillez lancer hoody init auparavant")
      process.exit(EXIT_WWW_NOT_FOUND)
    })


}

function deploy() {
  console.log("dans deploy")
}

