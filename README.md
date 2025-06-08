# ![logo](/icons/icon48.png) AutoDraw for skribbl.io

Questo progetto permette di caricare un'immagine, convertirla in pixel art con una palette colori predefinita e disegnarla automaticamente sul canvas di gioco di [skribbl.io](https://skribbl.io/).

---

## Caratteristiche principali

- **Conversione immagine -> pixel art**: ridimensiona e centra l'immagine, converte i colori nel set limitato della palette pixel art.
- **Disegno ottimizzato**: disegna linee orizzontali di pixel adiacenti dello stesso colore per velocizzare il processo.
- **Simulazione input utente**: seleziona strumenti, colori e dimensioni pennello tramite eventi DOM per integrare il disegno nel gioco.
- **Drag & drop immagine**: permette di trascinare un'immagine sopra il canvas di gioco per iniziare subito la conversione e il disegno, mostrando un messaggio "Rilascia l'immagine qui" con scurimento durante il drag sul canvas.
- **Gestione interruzione disegno**: supporta l'interruzione pulita del disegno in corso per caricare una nuova immagine.
- **Ritardi controllati** per evitare sovraccarichi di eventi e mantenere il disegno visibile e fluido.

---

## Variabili di configurazione

- `PIXEL_WIDTH` : larghezza in pixel logici del canvas di destinazione.
- `PIXEL_HEIGHT` : altezza in pixel logici.
- `SPESSORE_PENNELLO` (0-4): indice per la dimensione del pennello, 0 è il più piccolo.

---

## Uso

1. **Installazione**

   - Vai nella sezione dei rilasci
   - Scarica l'ultima versione disponibile e decomprimila
   - Apri chrome://extensions/ e clicca su "Carica estensione non pacchetizzata"
   - Seleziona la cartella decompressa
   - Sei pronto per disegnare delle opere d'arte

1. **Drag & Drop**

   Trascinare un'immagine sopra il canvas di gioco (il campo dove il giocatore può disegnare). Apparirà un overlay "Rilascia l'immagine qui" che scompare al rilascio e avvierà la conversione + disegno.

2. **Fatto!**

   Lo script gestisce:
   - Conversione del disegno in PixelArt con la palette di colori messa a disposizione del giocatore.
   - Conversione del PixelArt in coordinate per ogni singolo pixel.
   - Selezione degli strumenti e colori di gioco.
   - Ritardi tra i tratti per evitare di perdere dei pixel in fase di disegno.

---

## Struttura principale del codice

- **Classe `PixelArt`**  
  Contiene la palette colori e la logica per convertire immagini in pixel art limitata alla palette.

- **Funzioni di selezione UI**  
  `selectTool(toolName)`, `selectSize(sizeIndex)`, `selectColor(colorRgb)` per simulare la scelta di strumenti, dimensioni pennello e colori sulla toolbar di skribbl.io.

- **Funzione `drawLine`**  
  Simula un tratto orizzontale sul canvas tramite eventi pointer per disegnare più pixel contigui in un unico movimento.

- **Funzione `drawPixelMatrix`**  
  Riceve l'array di pixel art, identifica il colore di sfondo, riempie il canvas e disegna i pixel restanti raggruppandoli per colore e per riga.

- **Drag & drop**  
  Gestisce l'interazione di trascinamento e rilascio immagine sul canvas, mostrando un overlay visivo e attivando il disegno.

- **Gestione interruzione disegno**  
  La variabile globale `abortDrawing` permette di fermare disegni in corso prima di iniziare un nuovo disegno.

---

## Dipendenze

- Nessuna libreria esterna richiesta.
- Funziona direttamente con DOM e API canvas del browser.

---

## Compatibilità

- Testato su skribbl.io con interfaccia attuale.
- Richiede supporto per Pointer Events e accesso al canvas di gioco.

---

## Possibili miglioramenti da apportare

- Ottimizzazione della velocità e gestione di tecniche avanzate in fase di disegno.

---

## Licenza

Il codice è open-source e può essere modificato e distribuito liberamente.

---

Se hai domande o vuoi contribuire, scrivi pure!

---

*Script sviluppato per facilitare la creazione di pixel art su skribbl.io tramite automazione browser.*
