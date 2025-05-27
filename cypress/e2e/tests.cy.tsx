describe('Проверка доступа и личной информации', () => {
  it('Вход и редирект в личный раздел', () => {
    cy.intercept('GET', '**/api/auth/user', {
      statusCode: 200,
      body: {
        success: true,
        user: {
          email: 'test_user@example.com',
          name: 'Test User',
        }
      }
    }).as('fetchUser');

    cy.loginByApi();

    cy.visit('/');
    cy.contains('Личный кабинет').click();

    cy.wait('@fetchUser');

    cy.contains('Test User').click();
    cy.url().should('include', '/profile');
    cy.get('form', { timeout: 10000 }).should('exist');
    cy.get('input[name="name"]').should('have.value', 'Test User');
  });
});

describe('Интерактив бургер-конструктора', () => {
  beforeEach(() => {
    cy.fixture('ingredients.json').as('mockIngredients');
    cy.fixture('user.json').as('mockUser');

    cy.intercept('GET', '**/api/ingredients', {
      fixture: 'ingredients.json'
    }).as('loadIngredients');

    cy.intercept('GET', '**/api/auth/user', {
      fixture: 'user.json'
    }).as('loadUser');

    cy.setCookie('accessToken', 'mockToken');
    cy.window().then(w => {
      w.localStorage.setItem('refreshToken', 'mockToken');
    });

    cy.visit('/');
    cy.contains('Соберите бургер', { timeout: 10000 }).should('exist');
  });

  it('Проверка пустого состояния конструктора', () => {
    cy.contains('Выберите булки').should('be.visible');
    cy.contains('Выберите начинку').should('be.visible');
  });

  it('Вставка булки в сборку', () => {
    cy.contains('Флюоресцентная булка R2-D3').next().click();
    cy.contains('Флюоресцентная булка R2-D3', { timeout: 10000 }).should('exist');
  });

  it('Вставка начинки в сборку', () => {
    cy.contains('Начинки').scrollIntoView().click({ force: true });
    cy.contains('Биокотлета из марсианской Магнолии').next().click();
    cy.contains('Биокотлета из марсианской Магнолии').should('exist');
  });

  it('Формирование заказа и сброс конструктора', () => {
    cy.intercept('POST', '**/api/orders', {
      fixture: 'makeOrder.json',
      statusCode: 200
    }).as('submitOrder');

    cy.contains('Флюоресцентная булка R2-D3').next().click();
    cy.contains('Начинки').scrollIntoView();
    cy.contains('Биокотлета из марсианской Магнолии').next().click();

    cy.contains('Оформить заказ').should('not.be.disabled').click();

    cy.wait('@submitOrder', { timeout: 30000 })
      .its('response.statusCode')
      .should('eq', 200);

    cy.contains('идентификатор заказа').should('be.visible');
    cy.get('body').type('{esc}');

    cy.contains('Выберите булки').should('exist');
  });

  it('Проверка открытия и выхода из окна ингредиента', () => {
    cy.contains('Краторная булка').click();
    cy.url().should('include', '/ingredients/');
    cy.get('body').type('{esc}');
    cy.url().should('eq', 'http://localhost:4000/');
  });

  it('Закрытие ингредиентного окна по клику вне', () => {
    cy.contains('Краторная булка').click();
    cy.get('body').click(10, 10);
    cy.url().should('eq', 'http://localhost:4000/');
  });
});
