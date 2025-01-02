window.toolkit = () => {
  return {
    id: "toolkit",
    init: (deck) => {
      let currentChapterTitle;
      let currentSectionTitle;

      document.querySelectorAll("section.slide, section#toc").forEach((slide) => {
        const children = slide.children;
        if (children.length === 0) return;
        if (children[0].tagName === "H1") currentChapterTitle = children[0].textContent;

        if (children[0].tagName === "H2" || children[0].tagName === "H3") {
          if (children[0].tagName === "H2") currentSectionTitle = children[0].textContent;

          const headings = document.createElement("div");
          headings.setAttribute("class", "headings");

          const heading = document.createElement("span");
          heading.setAttribute("class", "heading");
          heading.innerHTML = currentChapterTitle;
          headings.append(heading);

          if (children[0].tagName === "H3") {
            const subheading = document.createElement("span");
            subheading.setAttribute("class", "subheading");
            subheading.innerHTML = currentSectionTitle;
            headings.append(subheading);
          }

          slide.prepend(headings);
        }

        if (children[0].tagName === "H4") {
          const container = document.createElement("div");
          container.classList.add("container");

          const content = document.createElement("div");
          content.classList.add("content");
          container.appendChild(content);

          const elements = Array.from(children).slice(1);
          const idx = elements.findIndex((child) => child.tagName === "ASIDE");
          const aside = elements[idx];
          if (idx !== -1) elements[idx].remove();

          elements.forEach((child) => content.appendChild(child));
          if (aside) container.appendChild(aside);
          slide.appendChild(container);
        }
      });
    },
  };
};
