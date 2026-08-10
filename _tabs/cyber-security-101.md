---
icon: fas fa-graduation-cap
order: 1
title: Cyber Security 101
---

<div id="course-module-list">
  {% for module in site.data.cyber_security_101 %}
    {% assign post_count = site.tags[module.slug].size %}
    {% if post_count > 0 %}
      <a href="{{ '/tags/' | append: module.slug | append: '/' | relative_url }}" class="card-wrapper card d-flex flex-row justify-content-between align-items-center p-2 mb-2 text-decoration-none">
        <span>
          <strong>{{ module.number }}.</strong> {{ module.title }}
        </span>
        <span class="text-muted small">
          {{ post_count }} room{% if post_count != 1 %}s{% endif %}
        </span>
      </a>
    {% else %}
      <div class="card-wrapper card d-flex flex-row justify-content-between align-items-center p-2 mb-2 text-muted">
        <span>
          <strong>{{ module.number }}.</strong> {{ module.title }}
        </span>
        <span class="text-muted small">in arrivo</span>
      </div>
    {% endif %}
  {% endfor %}
</div>
