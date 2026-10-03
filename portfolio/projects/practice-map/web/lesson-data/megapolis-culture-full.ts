import type { LessonSection } from "../curriculum";

export const sections: readonly LessonSection[] = [
  {
    heading: "A Lesson in Urban Concepts",
  },
  {
    heading: "1. Starting With the Words",
    blocks: [
      {"kind":"p","text":"Before we can talk about the culture of very large cities, we need to sort out the vocabulary, because the terms are used loosely and they do not all mean the same thing."},
      {"kind":"p","text":"**Metropolis** comes from the Greek for \"mother city.\" Originally it meant a city that founded colonies. Today it means a large, dominant city, usually the economic and cultural center of a region or country."},
      {"kind":"p","text":"**Megapolis** is the word most English speakers meet through translation. In Russian (*megapolis*), German, and several other languages, it is the everyday term for a huge city like Moscow, Istanbul, or São Paulo. In English it is usually treated as a variant of the next term."},
      {"kind":"p","text":"**Megalopolis** has a precise scholarly meaning. The French geographer Jean Gottmann popularized it in his 1961 study of the northeastern United States, where he observed that Boston, New York, Philadelphia, Baltimore, and Washington had grown into one continuous urbanized corridor. Gottmann's megalopolis was not one giant city. It was a *system* of cities fused by highways, rail lines, commuting patterns, and economic dependency. (Fittingly, there was an actual ancient Greek city called Megalopolis, founded around 371 BCE. It never quite lived up to its name.)"},
      {"kind":"p","text":"**Megacity** is the demographer's term. The United Nations uses it for any urban agglomeration of more than ten million people. In 1950 there were two, New York and Tokyo. Today there are more than thirty, and most of them are in Asia, Africa, and Latin America: Delhi, Shanghai, Dhaka, Cairo, Lagos, Mexico City, Kinshasa."},
      {"kind":"p","text":"**Mega-region** is the newest scale. It describes networks such as China's Pearl River Delta (Guangzhou, Shenzhen, Hong Kong, Dongguan, and others), which together hold tens of millions of people and function as a single economic machine."},
      {"kind":"p","text":"**Global city** is a different kind of category. It describes function, not size. The sociologist Saskia Sassen used it in 1991 for cities such as New York, London, and Tokyo that act as command centers of the world economy, concentrating finance, law, consulting, and advertising. A city can be enormous without being \"global\" in this sense, and a city such as Zurich or Singapore can be globally decisive without being enormous."},
      {"kind":"p","text":"Keep these distinctions in mind. *Megacity* is about headcount. *Megalopolis* is about connected territory. *Global city* is about power. \"Megapolis culture,\" the subject of this lesson, sits where all three overlap: the ways of living, thinking, and relating that emerge when vast numbers of people share dense, interconnected space."},
    ],
  },
  {
    heading: "2. The Engine: Size, Density, Heterogeneity",
    blocks: [
      {"kind":"p","text":"In 1938 the Chicago School sociologist Louis Wirth published an essay called \"Urbanism as a Way of Life.\" It remains one of the most useful starting points. Wirth argued that what makes a city a city comes down to three variables:"},
      {"kind":"list","ordered":true,"items":["**Size**: many people.","**Density**: many people packed closely together.","**Heterogeneity**: many *different kinds* of people."]},
      {"kind":"p","text":"Each variable has cultural consequences. Size means you cannot personally know most of the people around you, so relationships become partial and role-based. You know your barista as a barista, not as a whole person. Density means constant physical proximity to strangers, which forces new rules of behavior. Heterogeneity means that no single tradition can govern everyone, so norms become more negotiable, more plural, and more contested."},
      {"kind":"p","text":"Megacities push all three variables to extremes. A useful way to think about megapolis culture is as Wirth's urbanism *turned up past the point where it changes character*."},
      {"kind":"p","text":"**The Physics of Cities**"},
      {"kind":"p","text":"For the quantitatively inclined, this intuition has been formalized. In 2007, a team including Luís Bettencourt and Geoffrey West published a now-famous paper showing that many urban properties follow **power-law scaling** with population."},
      {"kind":"p","text":"* **Socioeconomic outputs** scale *superlinearly*, with an exponent of roughly 1.15. These include wages, patents, GDP, and the number of creative professionals. Double a city's population and you get not twice but about 2.2 times the innovation and economic output *per city*, which means more per person. * **Infrastructure** scales *sublinearly*, at roughly 0.85. This covers road surface, electrical cable, and gas stations. Bigger cities are more efficient per capita. * **Individual needs** scale *linearly*, at roughly 1.0. Housing units and water consumption grow in step with population."},
      {"kind":"p","text":"The uncomfortable part is that the superlinear pattern also applies to crime, infectious disease, and certain kinds of stress. The same density of interaction that produces innovation also produces friction. Cities intensify *everything* that depends on human contact."},
      {"kind":"p","text":"This is the hidden engine of megapolis culture. A megacity is a machine for multiplying encounters, and culture is what encounters produce."},
    ],
  },
  {
    heading: "3. The Megapolitan Mind",
    blocks: [
      {"kind":"p","text":"If the city intensifies encounters, what does that do to the people inside it?"},
      {"kind":"p","text":"**Simmel and the Blasé Attitude**"},
      {"kind":"p","text":"The foundational text here is Georg Simmel's 1903 essay \"The Metropolis and Mental Life,\" written in a rapidly expanding Berlin. Simmel argued that the big city bombards the individual with an \"intensification of nervous stimulation\": crowds, traffic, signs, noise, and endless novelty. A rural person can respond emotionally to each encounter. A city dweller who tried to do that would collapse."},
      {"kind":"p","text":"So the urban mind develops defenses. Simmel identified a **blasé attitude**, a kind of trained indifference in which differences between things are perceived but no longer *felt*. He also described **reserve**, a cool distance toward strangers that, from the outside, can look like coldness or even mild hostility. And he linked all of this to the **money economy**, which reduces qualitative differences to quantitative ones and trains people to think in terms of calculation, punctuality, and exchange."},
      {"kind":"p","text":"Simmel was not simply complaining. He saw that this same reserve gives the individual an unprecedented degree of *personal freedom*. No one is watching you, because no one has the attention to spare."},
      {"kind":"p","text":"**Overload and Civil Inattention**"},
      {"kind":"p","text":"In 1970 the psychologist Stanley Milgram updated Simmel with the concept of **overload**. When inputs exceed processing capacity, people adapt. They spend less time on each input, filter out low-priority ones, and build institutional buffers such as doormen, unlisted numbers, and today, noise-cancelling headphones."},
      {"kind":"p","text":"Milgram also described the **familiar stranger**: the person you see on the same train platform every morning for years but never speak to. This relationship is uniquely urban. It carries recognition without intimacy, and it turns out to matter. In emergencies, familiar strangers are often the first to talk to each other."},
      {"kind":"p","text":"The sociologist Erving Goffman supplied a related concept, **civil inattention**. When you pass a stranger, you briefly acknowledge their presence, perhaps with a glance, and then withdraw your attention to signal that you pose no threat and make no claim on them. Watch any crowded subway car in Tokyo, New York, or Mumbai and you will see a highly choreographed performance of civil inattention: eyes on phones, on the floor, on nothing. It looks like isolation. It is actually a cooperative social technology that lets hundreds of strangers share a metal box peacefully."},
    ],
  },
  {
    heading: "4. Freedom in Numbers: Subcultures and Self-Invention",
    blocks: [
      {"kind":"p","text":"There is a medieval German legal principle, *Stadtluft macht frei*: \"city air makes you free.\" A serf who escaped to a city and lived there for a year and a day could become legally free. The phrase has survived because it captures something enduring about large cities. They are where people go to become someone else."},
      {"kind":"p","text":"The sociologist Claude Fischer turned this into a theory in 1975. The older view held that big cities dissolve community and leave isolated individuals. Fischer argued the opposite: **size creates critical mass**. In a village of 500, there may be one person who loves experimental jazz, or one gay teenager, or one recent immigrant from Senegal. In a city of 20 million there are thousands, enough to form clubs, bars, neighborhoods, newspapers, places of worship, and scenes. Big cities don't destroy community. They *multiply* communities and allow them to specialize."},
      {"kind":"p","text":"This is why megacities are the breeding grounds of **subcultures**. Hip-hop came out of the Bronx. Punk took shape in London and New York. Otaku culture grew around Akihabara in Tokyo. Nollywood rose in Lagos. Each depended on enough people with an unusual interest finding each other in physical space."},
      {"kind":"p","text":"The network theorist Mark Granovetter adds another piece. In his 1973 paper \"The Strength of Weak Ties,\" he showed that new information, such as job opportunities, ideas, and trends, tends to flow through *acquaintances* rather than close friends, because close friends already know what you know. A megacity is an enormous reservoir of weak ties. That is one reason ideas move so fast there."},
      {"kind":"p","text":"When the social scientist Steven Vertovec studied London, he coined the term **superdiversity** to describe a situation where diversity is no longer a matter of a few large immigrant groups. Instead it is an intricate mesh of many small groups, differentiated by origin, legal status, language, religion, and generation. Megapolis culture is increasingly superdiverse, and that changes how belonging works. Identity becomes layered, and people code-switch between multiple worlds within a single day."},
    ],
  },
  {
    heading: "5. Reading the City: Space, Streets, and Mental Maps",
    blocks: [
      {"kind":"p","text":"Culture is not only in people's heads. It is also built into physical space."},
      {"kind":"p","text":"**Jane Jacobs and the Sidewalk Ballet**"},
      {"kind":"p","text":"In *The Death and Life of Great American Cities* (1961), Jane Jacobs attacked the planners of her day, who were bulldozing dense neighborhoods to build highways and isolated towers. She argued that good city life depends on mixed uses, with homes, shops, and workplaces side by side. It also depends on short blocks, old buildings alongside new ones, and enough density to keep streets busy at all hours."},
      {"kind":"p","text":"Two of her concepts became classics. **\"Eyes on the street\"** describes how shopkeepers, residents, and passers-by provide informal, continuous surveillance that keeps streets safe, without police. The **\"sidewalk ballet\"** describes the intricate, unplanned daily choreography of a living street. For Jacobs, urban order was *emergent*. It arose from the bottom up, not from a master plan. Geeks will recognize this as an argument about complex adaptive systems, made before that vocabulary was common."},
      {"kind":"p","text":"**Kevin Lynch and the Mental Map**"},
      {"kind":"p","text":"Around the same time, the urban planner Kevin Lynch asked residents of Boston, Jersey City, and Los Angeles to draw maps of their cities from memory. In *The Image of the City* (1960) he identified five elements people use to mentally organize urban space:"},
      {"kind":"p","text":"* **Paths**: streets, rail lines, and other channels of movement. * **Edges**: boundaries such as rivers, walls, and highways. * **Districts**: areas with recognizable character. * **Nodes**: junctions and focal points. * **Landmarks**: distinctive reference objects."},
      {"kind":"p","text":"A city with strong elements has high **imageability**. It is easy to hold in the mind. Megacities often struggle here, because no human brain can map 20 million people's worth of territory. Residents instead know their own fragment of the city intimately and treat the rest as abstract. In practice, many megacity dwellers navigate by transit diagrams. The Tokyo rail map or the London Tube map *becomes* the mental image of the city, even though it distorts real geography."},
      {"kind":"p","text":"**Third Places**"},
      {"kind":"p","text":"The sociologist Ray Oldenburg coined the term **third places** for the informal gathering spots that are neither home (the first place) nor work (the second). Cafés, barbershops, pubs, parks, and street-food stalls all qualify. In megacities, where homes are often tiny and workplaces impersonal, third places do enormous cultural work. Think of the *hawker centres* of Singapore, the *izakaya* of Tokyo, the *chai* stalls of Delhi, or the *mamak* restaurants of Kuala Lumpur. These are where the city socializes itself."},
    ],
  },
  {
    heading: "6. Time, Rhythm, and Movement",
    blocks: [
      {"kind":"p","text":"Megapolis culture is also a culture of *time*."},
      {"kind":"p","text":"The philosopher Henri Lefebvre proposed a method he called **rhythmanalysis**, which treats a city as a layering of rhythms. These include the rush hours, the opening and closing of shops, weekly markets, seasonal festivals, and the biological rhythms of sleeping bodies. Megacities increasingly become **24-hour cities**. Convenience stores never close, delivery riders work through the night, and global financial markets require someone always to be awake. Night itself becomes a contested cultural space, with its own economies, subcultures, and conflicts over noise and safety."},
      {"kind":"p","text":"Movement shapes everything. In many megacities, residents spend one to three hours a day commuting, which turns the commute into a cultural zone of its own. It is where people read, sleep, watch shows, work, and flirt. Japan's dense rail culture produced its own etiquette, from silent carriages to orderly queues marked on platforms. Lagos produced the *danfo* minibus with its conductors and improvised routes. Mexico City produced elaborate informal economies of vendors who board metro trains. **Transit systems are cultural institutions**, not just infrastructure."},
    ],
  },
  {
    heading: "7. The Global Layer",
    blocks: [
      {"kind":"p","text":"Megacities exist in two geographies at once: their local territory and the global network."},
      {"kind":"p","text":"Manuel Castells described this as the tension between the **space of places**, the physical locality where people live, and the **space of flows**, the networks of capital, information, and elites that connect, say, the financial district of Shanghai more tightly to the financial district of London than to the outskirts of Shanghai itself. Global cities, in Sassen's sense, are nodes in this flow-space. They develop a transnational professional culture with similar airports, hotels, coffee chains, co-working spaces, and English as the working language."},
      {"kind":"p","text":"The architect Rem Koolhaas captured this with characteristic provocation. In *Delirious New York* (1978) he celebrated Manhattan's **\"culture of congestion,\"** where density itself became a creative force and a skyscraper could stack a gym, a restaurant, and a golf course on top of each other. Later, in his essay \"The Generic City\" (1995), he described the opposite phenomenon: rapidly built cities with no history and no distinct identity, interchangeable airports and malls, cities that are \"what is left after large sections of urban life crossed over to cyberspace.\" Koolhaas refused to condemn this outright. He suggested that the generic city might be liberating precisely *because* it carries no heavy identity."},
      {"kind":"p","text":"The tension between the generic and the specific, between global sameness and local flavor, is one of the central dramas of megapolis culture. Every megacity is constantly negotiating it."},
    ],
  },
  {
    heading: "8. The Other Megacity: Informality",
    blocks: [
      {"kind":"p","text":"So far, much of the theory has come from Europe and North America. The world's fastest-growing megacities are not Paris or Chicago, though. They are Lagos, Kinshasa, Dhaka, Karachi, and Jakarta, and here a different set of concepts becomes essential."},
      {"kind":"p","text":"**Informality** refers to housing, work, and services that operate outside formal state regulation. In many megacities, the majority of residents live in informally built housing and earn their living in the informal economy as street vendors, recyclers, motorbike-taxi drivers, or home-based manufacturers. Mike Davis's *Planet of Slums* (2006) presented this as a crisis of global inequality. The urbanist Ananya Roy pushed back in an important way. She argued that informality is not simply a failure or an absence of order. It is a *mode of urbanization* in its own right, and states themselves often use it strategically, deciding what to tolerate and what to demolish."},
      {"kind":"p","text":"The theorist AbdouMaliq Simone, studying Johannesburg and other African cities, coined the phrase **\"people as infrastructure.\"** Where formal infrastructure is weak, residents themselves become the system. Networks of relationships, improvised collaborations, and constant reconfiguration do the work that pipes, wires, and institutions do elsewhere. A Lagos market is not chaos. It is an extraordinarily sophisticated, self-organizing logistics network running on trust, reputation, and constant negotiation."},
      {"kind":"p","text":"This forces a correction to the classical theories. Simmel's blasé, reserved city dweller may describe Berlin in 1903, but life in a dense informal settlement often demands the opposite: *intense* interdependence, constant social negotiation, and deep reliance on neighbors. There is no single \"megapolitan personality.\" There are many, shaped by the specific political economy of each city."},
    ],
  },
  {
    heading: "9. Fractures: Inequality and the Right to the City",
    blocks: [
      {"kind":"p","text":"Megacities concentrate wealth and poverty side by side, often within sight of each other. Several concepts help describe the resulting tensions."},
      {"kind":"p","text":"**Gentrification** was coined in 1964 by the sociologist Ruth Glass, describing middle-class newcomers displacing working-class residents in London. Today it names a global process. Rising land values, investment, and cultural \"discovery\" of a neighborhood transform its population and character, often pushing out the very communities that made it attractive."},
      {"kind":"p","text":"**Splintering urbanism**, a term from Stephen Graham and Simon Marvin (2001), describes how infrastructure fragments. Wealthy enclaves get private security, generators, water supplies, and toll roads, while other areas are bypassed. The city stops being a shared system and becomes a patchwork of connected and disconnected zones. Gated communities in São Paulo, where the wealthy famously commute by helicopter, are the textbook example."},
      {"kind":"p","text":"The **right to the city**, a phrase from Lefebvre (1968) later revived by the geographer David Harvey, is the political counter-concept. It holds that urban residents should have a collective say in how their city is shaped, not just individual rights to consume it. The phrase has become a rallying cry for housing movements, informal vendors, and protest movements worldwide."},
      {"kind":"p","text":"These fractures are part of megapolis culture, not an exception to it. Much urban art, music, and activism is a response to them."},
    ],
  },
  {
    heading: "10. Where This Is Heading",
    blocks: [
      {"kind":"p","text":"Three developments are reshaping how scholars think about megapolis culture now."},
      {"kind":"p","text":"**Planetary urbanization.** Neil Brenner and Christian Schmid argue that the old city-versus-countryside distinction no longer holds. Mines, farms, logistics hubs, and data centers far from any city are all part of an urban system. The megacity's \"culture\" extends into supply chains spanning continents. (The Greek planner Constantinos Doxiadis imagined something similar decades earlier, a future world city covering the planet that he called the **ecumenopolis**. Science-fiction fans will recognize Coruscant.)"},
      {"kind":"p","text":"**The digital overlay.** Smartphones, ride-hailing apps, food delivery platforms, and social media now mediate much of urban life. They change how people find third places, meet strangers, and navigate. The \"smart city\" promises efficiency through data, while critics warn of surveillance and corporate control. The city increasingly has a software layer with its own politics."},
      {"kind":"p","text":"**Climate.** Many megacities are coastal and low-lying: Jakarta, Dhaka, Shanghai, Lagos, Miami. Jakarta is sinking so fast that Indonesia is building a new capital on Borneo. Heat, flooding, and water stress will reshape megapolis culture in ways we are only beginning to understand."},
    ],
  },
  {
    heading: "Closing: A Toolkit for Reading Any Megacity",
    blocks: [
      {"kind":"p","text":"Next time you are in a very large city, in person or through a film, a novel, or a street-view wander, try applying what you have learned. Ask yourself:"},
      {"kind":"p","text":"* **Scale:** Is this a megacity (headcount), a megalopolis (connected region), a global city (network power), or some combination? * **The engine:** Where do encounters concentrate, and what do they produce: innovation, commerce, conflict? * **Mind:** How do people manage overload? What does civil inattention look like here? * **Subcultures:** What communities exist *only* because the city is big enough to sustain them? * **Space:** Where are the third places? What are the paths, edges, nodes, and landmarks of the mental map? * **Rhythm:** When does the city sleep, if ever? What happens on the commute? * **Global and local:** What feels generic, and what feels unmistakably *here*? * **Infrastructure:** What is formal, what is informal, and where are people acting as infrastructure? * **Fractures:** Who is connected and who is bypassed? Who has the right to this city?"},
      {"kind":"p","text":"The central insight running through all these thinkers is simple to state and endlessly rich to explore. **A megacity is a machine that multiplies human contact, and culture is what that contact produces.** Freedom and alienation, innovation and inequality, global sameness and fierce local identity all come from the same source: an unprecedented number of different people trying to share the same ground."},
    ],
  },
  {
    heading: "Further Reading (in Suggested Order for Beginners)",
    blocks: [
      {"kind":"list","ordered":true,"items":["Jane Jacobs, *The Death and Life of Great American Cities* (1961): readable, vivid, foundational.","Georg Simmel, \"The Metropolis and Mental Life\" (1903): short essay, widely available.","Edward Glaeser, *Triumph of the City* (2011): an economist's accessible case for density.","Kevin Lynch, *The Image of the City* (1960): short and visual.","Geoffrey West, *Scale* (2017): the physics-of-cities story for a general audience.","Saskia Sassen, *The Global City* (1991): denser, but defines the field.","AbdouMaliq Simone, \"People as Infrastructure\" (2004, *Public Culture*): an essential corrective from the Global South.","Rem Koolhaas, *Delirious New York* (1978): playful and provocative."]},
    ],
  },
];;
