---
icon: fas fa-graduation-cap
order: 1
title: Cyber Security 101
---

Il mio percorso di studio su [TryHackMe "Cyber Security 101"](https://tryhackme.com/path/outline/cybersecurity101): 14 moduli, 56 room, in preparazione alla certificazione SEC1.

<div id="course-module-list">
  {% for module in site.data.cyber_security_101 %}
    {% assign post_count = site.tags[module.slug].size %}
    <a href="{{ '/tags/' | append: module.slug | append: '/' | relative_url }}" class="card-wrapper card d-flex flex-row justify-content-between align-items-center p-3 mb-2 text-decoration-none">
      <span>
        <strong>{{ module.number }}.</strong> {{ module.title }}
      </span>
      <span class="text-muted small">
        {% if post_count > 0 %}
          {{ post_count }} room{% if post_count != 1 %}s{% endif %}
        {% else %}
          in arrivo
        {% endif %}
      </span>
    </a>
  {% endfor %}
</div>
