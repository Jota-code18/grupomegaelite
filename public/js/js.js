// main.js - JavaScript para o tema WordPress
jQuery(document).ready(function($) {
    
    // Smooth scroll para links âncora
    $('a[href*="#"]').not('[href="#"]').not('[href="#0"]').click(function(event) {
        if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
            var target = $(this.hash);
            target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
            if (target.length) {
                event.preventDefault();
                $('html, body').animate({
                    scrollTop: target.offset().top - 80
                }, 1000);
            }
        }
    });
    
    // Menu mobile responsivo
    $('.mobile-menu-toggle').click(function() {
        $('.main-navigation').toggleClass('active');
        $(this).toggleClass('active');
    });
    
    // Fechar menu mobile ao clicar em um link
    $('.main-navigation a').click(function() {
        if ($(window).width() <= 768) {
            $('.main-navigation').removeClass('active');
            $('.mobile-menu-toggle').removeClass('active');
        }
    });
    
    // Accordion funcionalidade
    $('.accordion-header').click(function() {
        var content = $(this).next('.accordion-content');
        var accordion = $(this).closest('.accordion');
        
        // Fechar outros accordions no mesmo grupo
        accordion.find('.accordion-content').not(content).slideUp().removeClass('active');
        accordion.find('.accordion-header').not(this).removeClass('active');
        
        // Toggle do accordion atual
        content.slideToggle().toggleClass('active');
        $(this).toggleClass('active');
    });
    
    // Back to top button
    var backToTop = $('<button class="back-to-top" title="Voltar ao topo">↑</button>');
    $('body').append(backToTop);
    
    $(window).scroll(function() {
        if ($(this).scrollTop() > 300) {
            backToTop.fadeIn();
        } else {
            backToTop.fadeOut();
        }
    });
    
    backToTop.click(function() {
        $('html, body').animate({
            scrollTop: 0
        }, 600);
        return false;
    });
    
    // Lazy loading para imagens
    if ('IntersectionObserver' in window) {
        var imageObserver = new IntersectionObserver(function(entries, observer) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    var img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(function(img) {
            imageObserver.observe(img);
        });
    }
    
    // Tooltip funcionalidade
    $('[data-tooltip]').hover(
        function() {
            var tooltip = $(this).attr('data-tooltip');
            $(this).append('<div class="tooltip-text">' + tooltip + '</div>');
            $('.tooltip-text').fadeIn();
        },
        function() {
            $('.tooltip-text').remove();
        }
    );
    
    // Animação de entrada para elementos
    function animateOnScroll() {
        $('.animate-on-scroll').each(function() {
            var elementTop = $(this).offset().top;
            var elementBottom = elementTop + $(this).outerHeight();
            var viewportTop = $(window).scrollTop();
            var viewportBottom = viewportTop + $(window).height();
            
            if (elementBottom > viewportTop && elementTop < viewportBottom) {
                $(this).addClass('animated');
            }
        });
    }
    
    $(window).on('scroll resize', animateOnScroll);
    animateOnScroll(); // Executar na carga da página
    
    // Melhorar acessibilidade do menu
    $('.main-navigation a').on('focus blur', function() {
        $(this).parents('ul, li').toggleClass('focus');
    });
    
    // Search form melhorada
    $('.search-form input[type="search"]').on('focus', function() {
        $(this).parent().addClass('focused');
    }).on('blur', function() {
        if ($(this).val() === '') {
            $(this).parent().removeClass('focused');
        }
    });
    
    // Tabs funcionalidade (se houver)
    $('.tab-nav a').click(function(e) {
        e.preventDefault();
        var target = $(this).attr('href');
        
        // Remover classe active de todas as abas
        $('.tab-nav a').removeClass('active');
        $('.tab-content').removeClass('active');
        
        // Adicionar classe active à aba selecionada
        $(this).addClass('active');
        $(target).addClass('active');
    });
    
    // Modal funcionalidade
    $('.modal-trigger').click(function(e) {
        e.preventDefault();
        var target = $(this).data('target');
        $(target).fadeIn().addClass('active');
        $('body').addClass('modal-open');
    });
    
    $('.modal-close, .modal-overlay').click(function() {
        $('.modal').fadeOut().removeClass('active');
        $('body').removeClass('modal-open');
    });
    
    // Fechar modal com ESC
    $(document).keydown(function(e) {
        if (e.keyCode === 27 && $('.modal.active').length) {
            $('.modal').fadeOut().removeClass('active');
            $('body').removeClass('modal-open');
        }
    });
    
    // Gallery lightbox simples
    $('.gallery img').click(function() {
        var src = $(this).attr('src');
        var alt = $(this).attr('alt');
        
        var lightbox = $('<div class="lightbox"><div class="lightbox-content"><img src="' + src + '" alt="' + alt + '"><button class="lightbox-close">×</button></div></div>');
        
        $('body').append(lightbox);
        lightbox.fadeIn();
        
        $('.lightbox-close, .lightbox').click(function(e) {
            if (e.target === this) {
                lightbox.fadeOut(function() {
                    lightbox.remove();
                });
            }
        });
    });
    
    // Formulário de contato melhorado
    $('.contact-form').submit(function(e) {
        var form = $(this);
        var submitBtn = form.find('button[type="submit"]');
        var originalText = submitBtn.text();
        
        // Validação básica
        var isValid = true;
        form.find('input[required], textarea[required]').each(function() {
            if ($(this).val().trim() === '') {
                $(this).addClass('error');
                isValid = false;
            } else {
                $(this).removeClass('error');
            }
        });
        
        if (!isValid) {
            e.preventDefault();
            showMessage('Por favor, preencha todos os campos obrigatórios.', 'error');
            return;
        }
        
        // Validação de email
        var email = form.find('input[type="email"]').val();
        if (email && !isValidEmail(email)) {
            e.preventDefault();
            form.find('input[type="email"]').addClass('error');
            showMessage('Por favor, insira um email válido.', 'error');
            return;
        }
        
        // Mostrar loading
        submitBtn.text('Enviando...').prop('disabled', true);
        
        // Simular envio (remover em produção)
        setTimeout(function() {
            submitBtn.text(originalText).prop('disabled', false);
            showMessage('Mensagem enviada com sucesso!', 'success');
            form[0].reset();
        }, 2000);
        
        e.preventDefault(); // Remover esta linha em produção
    });
    
    // Função para validar email
    function isValidEmail(email) {
        var regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }
    
    // Função para mostrar mensagens
    function showMessage(message, type) {
        var messageDiv = $('<div class="alert alert-' + type + '">' + message + '</div>');
        $('body').prepend(messageDiv);
        
        setTimeout(function() {
            messageDiv.fadeOut(function() {
                messageDiv.remove();
            });
        }, 5000);
    }
    
    // Contador de caracteres para textareas
    $('textarea[maxlength]').each(function() {
        var textarea = $(this);
        var maxLength = textarea.attr('maxlength');
        var counter = $('<div class="char-counter"><span class="current">0</span>/<span class="max">' + maxLength + '</span></div>');
        
        textarea.after(counter);
        
        textarea.on('keyup', function() {
            var currentLength = $(this).val().length;
            counter.find('.current').text(currentLength);
            
            if (currentLength > maxLength * 0.9) {
                counter.addClass('warning');
            } else {
                counter.removeClass('warning');
            }
        });
    });
    
    // Copiar para clipboard
    $('.copy-to-clipboard').click(function() {
        var target = $(this).data('target');
        var text = $(target).text();
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(function() {
                showMessage('Copiado para a área de transferência!', 'success');
            });
        } else {
            // Fallback para navegadores mais antigos
            var textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showMessage('Copiado para a área de transferência!', 'success');
        }
    });
    
    // Print button
    $('.print-button').click(function() {
        window.print();
    });
    
    // Social share buttons
    $('.social-share a').click(function(e) {
        e.preventDefault();
        var url = $(this).attr('href');
        var width = 600;
        var height = 400;
        var left = (screen.width / 2) - (width / 2);
        var top = (screen.height / 2) - (height / 2);
        
        window.open(url, 'share', 'width=' + width + ',height=' + height + ',left=' + left + ',top=' + top);
    });
    
    // Sticky sidebar
    function stickySidebar() {
        if ($(window).width() > 992) {
            var sidebar = $('.sidebar');
            var content = $('.content-area');
            var footer = $('.site-footer');
            
            if (sidebar.length && content.length) {
                var sidebarTop = sidebar.offset().top;
                var contentHeight = content.outerHeight();
                var sidebarHeight = sidebar.outerHeight();
                var footerTop = footer.offset().top;
                var scrollTop = $(window).scrollTop();
                
                if (scrollTop > sidebarTop - 20) {
                    if (scrollTop + sidebarHeight + 40 < footerTop) {
                        sidebar.addClass('sticky');
                        sidebar.css('top', '20px');
                    } else {
                        sidebar.removeClass('sticky');
                        sidebar.css('top', footerTop - sidebarHeight - scrollTop - 20 + 'px');
                    }
                } else {
                    sidebar.removeClass('sticky');
                    sidebar.css('top', 'auto');
                }
            }
        }
    }
    
    $(window).on('scroll resize', stickySidebar);
    
    // Reading progress bar
    function updateReadingProgress() {
        var article = $('.post-content, .page-content-text');
        if (article.length) {
            var articleTop = article.offset().top;
            var articleHeight = article.outerHeight();
            var windowHeight = $(window).height();
            var scrollTop = $(window).scrollTop();
            
            var progress = Math.min(100, Math.max(0, 
                ((scrollTop + windowHeight - articleTop) / articleHeight) * 100
            ));
            
            $('.reading-progress').css('width', progress + '%');
        }
    }
    
    // Adicionar barra de progresso de leitura
    if ($('.post-content, .page-content-text').length) {
        $('body').prepend('<div class="reading-progress-container"><div class="reading-progress"></div></div>');
        $(window).on('scroll', updateReadingProgress);
    }
    
    // Estimativa de tempo de leitura
    function calculateReadingTime() {
        $('.post-content, .page-content-text').each(function() {
            var text = $(this).text();
            var wordsPerMinute = 200;
            var wordCount = text.split(/\s+/).length;
            var readingTime = Math.ceil(wordCount / wordsPerMinute);
            
            var readingTimeText = readingTime + ' min de leitura';
            if (readingTime === 1) {
                readingTimeText = '1 min de leitura';
            }
            
            $(this).before('<div class="reading-time">' + readingTimeText + '</div>');
        });
    }
    
    calculateReadingTime();
    
    // Auto-hide header on scroll down
    var lastScrollTop = 0;
    var headerHeight = $('.site-header').outerHeight();
    
    $(window).scroll(function() {
        var scrollTop = $(this).scrollTop();
        
        if (scrollTop > headerHeight) {
            if (scrollTop > lastScrollTop) {
                // Scrolling down
                $('.site-header').addClass('header-hidden');
            } else {
                // Scrolling up
                $('.site-header').removeClass('header-hidden');
            }
        }
        
        lastScrollTop = scrollTop;
    });
    
    // Cookie consent (básico)
    if (!localStorage.getItem('cookieConsent')) {
        var cookieBanner = $('<div class="cookie-banner">Este site usa cookies para melhorar sua experiência. <button class="cookie-accept">Aceitar</button></div>');
        $('body').append(cookieBanner);
        
        $('.cookie-accept').click(function() {
            localStorage.setItem('cookieConsent', 'accepted');
            cookieBanner.fadeOut();
        });
    }
    
    // Preloader
    $(window).on('load', function() {
        $('.preloader').fadeOut();
    });
    
    // Dark mode toggle (opcional)
    $('.dark-mode-toggle').click(function() {
        $('body').toggleClass('dark-mode');
        localStorage.setItem('darkMode', $('body').hasClass('dark-mode'));
    });
    
    // Aplicar dark mode salvo
    if (localStorage.getItem('darkMode') === 'true') {
        $('body').addClass('dark-mode');
    }
    
}); // Fim do document ready

// Função para detectar dispositivo móvel
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Função para lazy loading de vídeos
function lazyLoadVideos() {
    const videos = document.querySelectorAll('video[data-src]');
    
    if ('IntersectionObserver' in window) {
        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const video = entry.target;
                    video.src = video.dataset.src;
                    video.load();
                    videoObserver.unobserve(video);
                }
            });
        });
        
        videos.forEach(video => {
            videoObserver.observe(video);
        });
    }
}

// Inicializar lazy loading de vídeos
document.addEventListener('DOMContentLoaded', lazyLoadVideos);

// Service Worker para PWA (opcional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('SW registered: ', registration);
            })
            .catch(function(registrationError) {
                console.log('SW registration failed: ', registrationError);
            });
    });
}