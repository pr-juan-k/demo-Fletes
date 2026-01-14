/*
 Logica para enviar comentario para mejorar la app   
 */

document.addEventListener('DOMContentLoaded', function() {
  const feedbackForm = document.getElementById('whatsapp-feedback-form');

  if (feedbackForm) {
      feedbackForm.addEventListener('submit', function(e) {
          e.preventDefault(); // Evita que la página se recargue

          // --- CONFIGURACIÓN ---
          const telefono = "5493811234567"; // REEMPLAZA CON TU NÚMERO (Código de país + número sin el +)
          // ---------------------

          // Obtener valores de los campos
          const nombre = document.getElementById('nombre').value;
          const apellido = document.getElementById('apellido').value;
          const comentario = document.getElementById('comentario').value;

          // Armar el mensaje con formato (usando negritas de WhatsApp)
          const mensaje = 
              `*NUEVO COMENTARIO PARA MEJORAR APP*%0A` +
              `--------------------------------%0A` +
              `*Usuario:* ${nombre} ${apellido}%0A` +
              `*Comentario:*%0A${comentario}%0A` +
              `--------------------------------`;

          // Crear el enlace final
          const urlWhatsApp = `https://api.whatsapp.com/send?phone=${5493815088924}&text=${mensaje}`;

          // Abrir en una nueva pestaña
          window.open(urlWhatsApp, '_blank');
      });
  }
});

/*
Logica para cargar video instructivo de como usar la app
*/ 
const video = document.getElementById('tutorialVideo');

function togglePlay() {
    if (video.paused) {
        video.play();
        document.querySelector('.video-overlay-play').style.display = 'none';
    } else {
        video.pause();
        document.querySelector('.video-overlay-play').style.display = 'flex';
    }
}

function forwardVideo() {
    video.currentTime += 10;
}

function rewindVideo() {
    video.currentTime -= 10;
}

function fullscreenVideo() {
    if (video.requestFullscreen) {
        video.requestFullscreen();
    } else if (video.webkitRequestFullscreen) { /* Safari */
        video.webkitRequestFullscreen();
    } else if (video.msRequestFullscreen) { /* IE11 */
        video.msRequestFullscreen();
    }
}

// Permitir clic sobre el video también
video.addEventListener('click', togglePlay);
document.getElementById('playBtn').addEventListener('click', togglePlay);

// En tu logica.js
const scrollTop = document.querySelector('#scroll-top');
const whatsappBtn = document.querySelector('#whatsapp-btn'); // Nueva referencia

function toggleScrollButtons() {
    if (scrollTop) { // Asegúrate de que el elemento existe
        window.scrollY > 100 ? scrollTop.classList.add('active') : scrollTop.classList.remove('active');
    }
    if (whatsappBtn) { // Asegúrate de que el elemento existe
        // Puedes usar la misma lógica o diferente
        window.scrollY > 100 ? whatsappBtn.classList.add('active') : whatsappBtn.classList.remove('active');
    }
}

// Escucha el evento de scroll
window.addEventListener('load', toggleScrollButtons);
document.addEventListener('scroll', toggleScrollButtons);

// Asegúrate de que el CSS tenga la clase .active
/*
.whatsapp-btn {
    opacity: 0;
    pointer-events: none; // Evita clicks cuando está oculto
    transform: translateY(20px);
}
.whatsapp-btn.active {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
}
*/




document.addEventListener('DOMContentLoaded', function() {
  const solicitarAhoraRadio = document.getElementById('solicitarAhora');
  const programarFechaRadio = document.getElementById('programarFecha');
  const programarFechaCampos = document.getElementById('programarFechaCampos');

  function toggleFechaCampos() {
    if (programarFechaRadio.checked) {
      programarFechaCampos.style.display = 'block';
    } else {
      programarFechaCampos.style.display = 'none';
    }
  }

  solicitarAhoraRadio.addEventListener('change', toggleFechaCampos);
  programarFechaRadio.addEventListener('change', toggleFechaCampos);

  // Inicializar el estado al cargar la página
  toggleFechaCampos();
});




document.addEventListener('DOMContentLoaded', function() {
  const solicitarAhoraRadio = document.getElementById('solicitarAhora');
  const programarFechaRadio = document.getElementById('programarFecha');
  const programarFechaCampos = document.getElementById('programarFechaCampos');

  function toggleFechaCampos() {
    if (programarFechaRadio.checked) {
      programarFechaCampos.style.display = 'block';
    } else {
      programarFechaCampos.style.display = 'none';
    }
  }

  solicitarAhoraRadio.addEventListener('change', toggleFechaCampos);
  programarFechaRadio.addEventListener('change', toggleFechaCampos);

  // Inicializar el estado al cargar la página
  toggleFechaCampos();
});


/*
FIN mi JS   
 */

(function() {
  "use strict";

  
  function toggleScrolled() {
    const selectBody = document.querySelector('body');
    const selectHeader = document.querySelector('#header');
    if (!selectHeader.classList.contains('scroll-up-sticky') && !selectHeader.classList.contains('sticky-top') && !selectHeader.classList.contains('fixed-top')) return;
    window.scrollY > 100 ? selectBody.classList.add('scrolled') : selectBody.classList.remove('scrolled');
  }

  document.addEventListener('scroll', toggleScrolled);
  window.addEventListener('load', toggleScrolled);

  /**
   * Mobile nav toggle
   */
  const mobileNavToggleBtn = document.querySelector('.mobile-nav-toggle');

  function mobileNavToogle() {
    document.querySelector('body').classList.toggle('mobile-nav-active');
    mobileNavToggleBtn.classList.toggle('bi-list');
    mobileNavToggleBtn.classList.toggle('bi-x');
  }
  if (mobileNavToggleBtn) {
    mobileNavToggleBtn.addEventListener('click', mobileNavToogle);
  }

  /**
   * Hide mobile nav on same-page/hash links
   */
  document.querySelectorAll('#navmenu a').forEach(navmenu => {
    navmenu.addEventListener('click', () => {
      if (document.querySelector('.mobile-nav-active')) {
        mobileNavToogle();
      }
    });

  });

  /**
   * Toggle mobile nav dropdowns
   */
  document.querySelectorAll('.navmenu .toggle-dropdown').forEach(navmenu => {
    navmenu.addEventListener('click', function(e) {
      e.preventDefault();
      this.parentNode.classList.toggle('active');
      this.parentNode.nextElementSibling.classList.toggle('dropdown-active');
      e.stopImmediatePropagation();
    });
  });

  /**
   * Preloader
   */
  const preloader = document.querySelector('#preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      preloader.remove();
    });
  }

  /**
   * Scroll top button
   */
  let scrollTop = document.querySelector('.scroll-top');

  function toggleScrollTop() {
    if (scrollTop) {
      window.scrollY > 100 ? scrollTop.classList.add('active') : scrollTop.classList.remove('active');
    }
  }
  scrollTop.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  window.addEventListener('load', toggleScrollTop);
  document.addEventListener('scroll', toggleScrollTop);

  /**
   * Animation on scroll function and init
   */
  function aosInit() {
    AOS.init({
      duration: 600,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
  }
  window.addEventListener('load', aosInit);

  /**
   * Initiate Pure Counter
   */
  new PureCounter();

  /**
   * Init isotope layout and filters
   */
  document.querySelectorAll('.isotope-layout').forEach(function(isotopeItem) {
    let layout = isotopeItem.getAttribute('data-layout') ?? 'masonry';
    let filter = isotopeItem.getAttribute('data-default-filter') ?? '*';
    let sort = isotopeItem.getAttribute('data-sort') ?? 'original-order';

    let initIsotope;
    imagesLoaded(isotopeItem.querySelector('.isotope-container'), function() {
      initIsotope = new Isotope(isotopeItem.querySelector('.isotope-container'), {
        itemSelector: '.isotope-item',
        layoutMode: layout,
        filter: filter,
        sortBy: sort
      });
    });

    isotopeItem.querySelectorAll('.isotope-filters li').forEach(function(filters) {
      filters.addEventListener('click', function() {
        isotopeItem.querySelector('.isotope-filters .filter-active').classList.remove('filter-active');
        this.classList.add('filter-active');
        initIsotope.arrange({
          filter: this.getAttribute('data-filter')
        });
        if (typeof aosInit === 'function') {
          aosInit();
        }
      }, false);
    });

  });

  /**
   * Init swiper sliders
   */
  function initSwiper() {
    document.querySelectorAll(".init-swiper").forEach(function(swiperElement) {
      let config = JSON.parse(
        swiperElement.querySelector(".swiper-config").innerHTML.trim()
      );

      if (swiperElement.classList.contains("swiper-tab")) {
        initSwiperWithCustomPagination(swiperElement, config);
      } else {
        new Swiper(swiperElement, config);
      }
    });
  }

  window.addEventListener("load", initSwiper);

  /**
   * Initiate glightbox
   */
  const glightbox = GLightbox({
    selector: '.glightbox'
  });

})();