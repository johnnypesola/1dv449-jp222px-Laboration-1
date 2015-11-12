# 1dv499-Laboration-1

Frågor och svar: 

*  Finns det några etiska aspekter vid webbskrapning. Kan du hitta något rättsfall?
   
Man kan som utvecklare välja att ignorera robots.txt för att skrapa sidor som sidans ägare kanske inte önskar att man skrapar. Det är möjligt att med sin skrapa hitta känslig information och eventuella säkerhetshål. Ifall skrapan är inte är ordentligt programmerad så kan den överbelasta serverägarens server.

Det finns ett fall i USA där [Resultly’s skrapa överbelastade QVC’s server](http://www.forbes.com/sites/ericgoldman/2015/03/24/qvc-cant-stop-web-scraping/) och QVS begärde 2 miljoner dollar i skadestång för detta.

*  Finns det några riktlinjer för utvecklare att tänka på om man vill vara "en god skrapare" mot serverägarna?
   
Ta först reda på om det är ok att skrapa hemsidan genom att leta efter riktlinjer för detta på själva hemsidan. Respektera innehållet i robots.txt vid själva skrapandet. Försök att inte överbelasta sidan målservern vid skrapandet. Ange att du är en skrapa i HTTP headern så serverägaren se i sin statistik att det är en skrapa som står för besökstatistiken.

*  Begränsningar i din lösning- vad är generellt och vad är inte generellt i din kod?
   
Grundfunktionaliteten för skrapan är genrell, som att hämta en sida eller som att läsa in alla länkar ifrån den. Jag tyckte att det var allmänt svårt att skriva väldigt generell kod för skrapan. Det som jag kunnat göra generellt har jag gjort i en egen "klass". Den sidspecifika koden är i en egen service "klass".

*  Vad kan robots.txt spela för roll?
   
Filen finns till för att bestämma ifall webcrawlers får tillgång till information på olika url:er som finns på sidan. Detta är dock ingen garanti utan illasinnade crawlers kan helt enkelt välja att ignorera denna fil. De som oftast följer denna är de seriösa sökmotorernas crawlers.
