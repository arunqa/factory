---
diagrams: mermaid
---

<pre id="diagram1" class="kroki-diagram" style="display: none">
@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml

System(buyer, "Buyer", "Medigy brings innovation decision makers ('buyers' or 'users') at HDOs to authoritative information, institutions, products, services, people and insights so that they can make evidence-driven purchasing decisions via peer reviews")
System(supplier, "Supplier", "Medigy brings innovation suppliers' offerings to buyers and users, allowing innovators to help HDO buyers move through the middle of their sales funnels via real-time transparent social proof, qualitative experience, and quantitative evidence")
Person(practitioner, "Practitioner", "Medigy creates clinical and non-clinical practitioner networks which influence demand at HDOs and supply peer reviews for offerings")

Rel_Right(buyer, supplier, "buys from")
Rel_Left(supplier, buyer, "gets buyer intent from")
Rel(practitioner, supplier, "influences")
Rel(practitioner, buyer, "influences")
@enduml
</pre>

<div class="mermaid">
  graph LR
    PhaseI["Phase I: Aggregate Demand<br><br>Become trusted curator of content<br>Create practitioner networks via CoP<br>Build Buyer Intent Intelligence functionality"] --> PhaseII["Phase II: Influence Supply<br><br>Increase suppliers' access to buyers<br>Help buyers select diffusable innovations<br>Help Integrators diffuse innovations at HDOs<br>Augment traditional industry analyst firms"]
    PhaseII --> PhaseIII["Phase III: Influence Demand<br><br>Replace traditional industry analyst firms<br>Create Medigy Ventures to fund innovations<br>Give buyers a real marketplace<br>Help HDOs diffuse innovations themselves"]
</div>
