-----------------------------------------------------------------
# Jenkins on Rocky Linux 9
-----------------------------------------------------------------

Ce este Jenkinssss?
Jenkins este un automation server bazat pe Java cu care putem defini continuous integration si continuous delivery (CI/CD) jobs sau pipelines.
Continuous integration (CI) este o practica DevOps in care membrii unei echipe commit modificari ale codului regulat in GIT, dupa care porneste un build si ruleaza teste automate. Continuous delivery (CD) este tot o practica DevOps prin care modificarile codului sunt deploy-ate in productie.

Cu ce ne va ajuta pe noi Jenkins?
Vom automatiza procesul de build si deploy a imaginilor docker. Buildul se va face de catre Jenkins ori de cate ori se va comite o modificare a codului in GitHub. Apoi noua imagine se va push-ui in DockerHub automat , tot din Jeknins.

Instalare Jenkins intr-o masina virtuala care ruleaza Rocky Linux 9

Confirmați că system repositories funcționează (dupa pornirea masinii virtuale, la prima executare a comenzii sudo, o sa va ceara parola userului. In cazul meu, userul este student, la voi poate fi diferit):

sudo dnf repolist
 

Pasul 1: Instalați OpenJDK 21 pe Rocky Linux 9
Listați versiunile disponibile ale JDK pe Rocky Linux 9:

sudo dnf search java-*-openjdk
 
O să instalăm pachetul java-21-openjdk:

sudo dnf -y install java-21-openjdk
 
La finalul instalarii o sa vedem mesajul Complete! Si cateva detalii despre pachetele instalate, java si dependintele necesare:
 

Verificam versiunea de java instalata default pe masina noastra virtuala:

java -version
 
Pasul 2: Adăugați repository-ul Jenkins la Rocky Linux
Echipa Jenkins menține un repository cu pachete RPM pentru Jenkins. Vom adăuga acest repository, apoi vom instala pachete din el.
Utilizați comanda wget pentru a descărca fișierul jenkins.repo și plasați-l în directorul corect:

sudo wget -O /etc/yum.repos.d/jenkins.repo https://pkg.jenkins.io/redhat-stable/jenkins.repo
 
De asemenea, importați cheia GPG folosită pentru a semna pachetele Jenkins:

sudo rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io-2023.key
 
Verificam daca repository-ul Jenkins este disponibil local:

sudo dnf repolist
 
Putem vedea pe ultima linie, coloana intai, repo id numit “jenkins”.

Step 3: Install Jenkins Server on Rocky Linux 9
Comanda de instalare a lui Jenkins:

sudo dnf -y install jenkins
 

Porniți serviciul Jenkins pe Rocky Linux 9 (dupa ce rulati comanda de start, asteptati in jur de 1 minut ca Jenkins sa porneasca):

sudo systemctl start jenkins
 
Trebuie sa configuram Jenkins sa porneasca odata cu masina virtuala (system boot):

sudo systemctl enable jenkins
 
Verificam daca Jenkins intr-adevar ruleaza pe masina noastra virtuala:

sudo systemctl status jenkins
 
Putem observa cuvintele de culoare verde: active (running). Asta ne spune ca Jenkins este pornit. Daca din anumite motive nu va porni, o sa vedeti un mesaj de culoarea rosie care va incepe probabil cu cuvantul “fail” sau “failed”.

Pasul 4: Configurați Jenkins pe Rocky Linux 9 din interfața web
După instalare și pornirea serviciului, mergeți la consola browserului web pe URL:
http://localhost:8080
Ar trebui să vedeti o pagină de bun venit și instructiuni despre cum să obțineți parola inițială de administrator:
 
Ca sa vedem parola initiala, trebuie sa efectuam comanda cat pe fisierul /var/lib/jenkins/secrets/initialAdminPassword (Parola initiala e diferita la fiecare instalare, cand instalati voi, o sa aveti o alta parola initiala):

sudo cat /var/lib/jenkins/secrets/initialAdminPassword
 
Copy si paste la parola in pagina Jenkins in casuta Administrator Password si apoi apasati butonul Continue:
 
Dupa ce ati adaugat parola, O sa apara fereastra urmatoare, unde selectati “Select plugins to install”.
  

La urmatorul pas, cautam dupa “git” si o sa instalam doar pluginul “Git”. O sa mai apara si alte pluginuri, asa ca verificati cu atentie sa aiba simplu, numele Git, ca in poza urmatoare:
 
 
Asteptam sa termine de instalat toate pluginurile necesare.

Dupa acest pas, o sa ne configuram userul de administrare si apasam butonul Save and Continue:
 
Dupa acest pas, o sa apara pasul de Instance Configuration, nu modificam nimic, doar apasam pe Save and Finish.
 
Apasam pe butonul de Start using Jenkins:
 
Am setat Jenkins si putem sa incepem sa il folosim. Urmatoarea poza ne arata prima pagina care apare dupa ce am terminat setup-ul. 

In acest moment al instalarii de Jenkins, consideram ca aveti deja instalat pe masina virtuala, “podman” (identic cu docker, ar trebui sa il aveti instalat de la cursul de podman) si consideram ca acesta este setat sa porneasca la startup.
Consideram ca aveti instalat pe masina virtuala, “git” (ar trebui sa il aveti instalat de la cursul de git).
Mai consideram ca aveti cont pe Docker Hub https://hub.docker.com/
O sa avem nevoie de acest cont pentru a face push imaginii careia ii vom face build din Jenkins in Docker Hub.
Consideram ca ati creat un repository in DockerHub cu numele “mynodejs” pentru a putea face push imaginilor create cu Jenkins:
Selectati Create repository in pagina web a DockerHub:
 
Apoi adaugati “mynodejs” la Repository Name si apasati Create, la fel ca in imaginea de mai jos:
 
Pasi necesari pentru a pregati Jenkins pentru a face push sau upload imaginii careia ii vom face build

Login as root:

sudo su -
 
Avem nevoie sa aflam id-ul userului Jenkins cu comanda:

id jenkins
 
Notam numarul “uid=981” al userului jenkins, avem nevoie sa il folosim la urmatoarea comanda. In cazul nostru, este 981. In cazul vostru, e posibil sa fie alt numar, depinde de ce aplicatii s-au mai instalat pe aceasta instanta de linux sau ce useri ati create sau au create aceste aplicatii instalate.
Rulam comenzile urmatoare pentru ca userul Jenkins sa aiba destule permisiuni pentru a face build unei imagini de docker (podman).

loginctl enable-linger 981    (inlocuiti 981 cu uid al lui Jenkins instalat la voi pe calculator)

echo jenkins:10000:65536 >> /etc/subuid

echo jenkins:10000:65536 >> /etc/subgid
 

Jenkins automation
Exercitiu:
Creati un nou Job in Jenkins care sa faca build unei imagini de docker, sa ii puna tag-uri si sa ii faca push in docker hub.
Pasul 1.
Adaugare credentialele username si parola pentru Docker Hub

Inainte de a pregati job-ul, trebuie sa adaugam user si parola de docker hub ca si variabile in Jenkins. Pentru aceasta, trebuie sa mergem la Manage Jenkins:
 
Click on Credentials
 
Click on System
 
Click on Global credentials (unrestricted)
 
Click on blue button on the right Add Credentials
 
Aici adaugam credentials ca in poza urmatoare:
Lasam Kind asam cum este – Username with password.
Adaugam propriul username pentru docker hub, propria parola si ID numit DOCKER_CREDENTIALS si descrierea “Docker username and password”:
 
Click on Create.

Pasul 2.
Mergeti in pagina default a lui Jenkins si selectati “New item”
 
Adaugati un nume, selectati “Freestyle project” si apasati Ok
 
La pasul General, adaugati o descriere, apoi scroll la pasul urmator

La pasul Source Code Management selectati Git la Repository URL si adaugati: https://github.com/bogdanobogeanu/nodejs-uvt.git

Mai jos, la acelasi pas, avem setarea Branches to build, lasam default, master
 
La pasul Triggers Selectati Pool SCM si la Schedule adaugati:  H/5 * * * * . Acest schedule o sa verifice in git la fiecare 5 minute daca exista o schimbare in cod si o sa porneasca job-ul creat de noi.
 
La pasul Environment bifam casuta cu Use secret text(s) or file(s) apasam pe Add si selectam Username and password (separated):
 
Apoi adaugam variabilele ca in poza de mai jos – Username Variable: DOCKER_USER si Password Variable: DOCKER_PASSWORD. Credentials se vor selecta automat pentru ca avem un singur credentials adaugat, cel de Docker username and password:
 
La pasul Build Steps selectam Add build step si apoi Execute Shell
 
Apoi adaugam in fereastra comanda de build: 

podman build -t mynodejs:1.0.0 .
  
Mai adaugam inca un Build step si apoi Execute Shell si adaugam comenzile pentru a porni si testa imaginea careia i-am facut build la pasul anterior

podman run --name mynodejs -d -p 8081:8080 -it mynodejs:1.0.0

sleep 10

curl localhost:8081/nodejs

Adaugam inca un Build step si inca un Execute shell unde rulam comenzile de stop al containerului mynodejs si apoi comanda de delete a containerului mynodejs

podman stop mynodejs

podman rm mynodejs

Adaugam un ultim Build step si un Execute shell pentru face login in Docker Hub si pentru a seta tag-urile imaginii construite de Jenkins. Cu ajutorul tagurilor setate correct, vom putea face push la imaginea creata in Docker Hub. Jenkins server are un set de variabile predefinite, printre care si BUILD_NUMBER , pe care il vom folosi pentru a face tag-ul imaginii docker :

podman login -u $DOCKER_USER -p $DOCKER_PASSWORD docker.io 

podman tag mynodejs:1.0.0 bogdan1980b/mynodejs:latest

podman push bogdan1980b/mynodejs:latest

podman tag mynodejs:1.0.0 bogdan1980b/mynodejs:${BUILD_NUMBER}

podman push bogdan1980b/mynodejs:${BUILD_NUMBER}

Inlocuiti userul bogdan1980b din comenzi cu userul personal de DockerHub.
Selectati apoi Save si apoi Build now. O sa vedeti in stanga, jos, build-ul caruia i-am dat start.
Este posibil ca jobul pornit sa dea fail din cauza unui bug de system.
Daca toti pasii au fost efectuati correct, o sa vedem ca job-ul nostru a fost finalizat cu success:
In caz ca apar erori, putem accesa Output-ul consolei job-ului unde vom putea vedea logurile. Trebuie doar sa selectam job-ul din stanga jos  si apoi Console Output
Daca totul este ok si job-ul s-a finalizat fara erori, ar trebui sa puteti gasi imaginea in DockerHub.
Verificati in contul vostru de DockerHub ca aveti ultima versiune de imagine.
