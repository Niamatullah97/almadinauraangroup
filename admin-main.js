import { injectQuery as __vite__injectQuery } from "/@vite/client";import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/main.js");import {
  AuthService
} from "/chunk-SOBTRDAP.js";
import "/chunk-PTS4LIQN.js";
import "/chunk-VUJOFXKG.js";

// src/main.ts
import { bootstrapApplication } from "/@fs/D:/Personal/My Work/Kabootar/apps/admin/.angular/cache/19.2.27/admin/vite/deps/@angular_platform-browser.js?v=a6adf28c";

// src/app/app.config.ts
import { provideZoneChangeDetection } from "/@fs/D:/Personal/My Work/Kabootar/apps/admin/.angular/cache/19.2.27/admin/vite/deps/@angular_core.js?v=a6adf28c";
import { provideRouter, withEnabledBlockingInitialNavigation } from "/@fs/D:/Personal/My Work/Kabootar/apps/admin/.angular/cache/19.2.27/admin/vite/deps/@angular_router.js?v=a6adf28c";
import { provideHttpClient, withInterceptors } from "/@fs/D:/Personal/My Work/Kabootar/apps/admin/.angular/cache/19.2.27/admin/vite/deps/@angular_common_http.js?v=a6adf28c";

// src/app/core/guards/auth.guard.ts
import { inject } from "/@fs/D:/Personal/My Work/Kabootar/apps/admin/.angular/cache/19.2.27/admin/vite/deps/@angular_core.js?v=a6adf28c";
import { Router } from "/@fs/D:/Personal/My Work/Kabootar/apps/admin/.angular/cache/19.2.27/admin/vite/deps/@angular_router.js?v=a6adf28c";
var authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (authService.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(["/auth/login"]);
};

// src/app/core/guards/guest.guard.ts
import { inject as inject2 } from "/@fs/D:/Personal/My Work/Kabootar/apps/admin/.angular/cache/19.2.27/admin/vite/deps/@angular_core.js?v=a6adf28c";
import { Router as Router2 } from "/@fs/D:/Personal/My Work/Kabootar/apps/admin/.angular/cache/19.2.27/admin/vite/deps/@angular_router.js?v=a6adf28c";
var guestGuard = () => {
  const authService = inject2(AuthService);
  const router = inject2(Router2);
  if (!authService.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(["/dashboard"]);
};

// src/app/features/auth/login.component.ts
import { Component, inject as inject3 } from "/@fs/D:/Personal/My Work/Kabootar/apps/admin/.angular/cache/19.2.27/admin/vite/deps/@angular_core.js?v=a6adf28c";
import { FormBuilder, ReactiveFormsModule, Validators } from "/@fs/D:/Personal/My Work/Kabootar/apps/admin/.angular/cache/19.2.27/admin/vite/deps/@angular_forms.js?v=a6adf28c";
import { Router as Router3 } from "/@fs/D:/Personal/My Work/Kabootar/apps/admin/.angular/cache/19.2.27/admin/vite/deps/@angular_router.js?v=a6adf28c";
import * as i0 from "/@fs/D:/Personal/My Work/Kabootar/apps/admin/.angular/cache/19.2.27/admin/vite/deps/@angular_core.js?v=a6adf28c";
import * as i1 from "/@fs/D:/Personal/My Work/Kabootar/apps/admin/.angular/cache/19.2.27/admin/vite/deps/@angular_forms.js?v=a6adf28c";
function LoginComponent_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "p", 2);
    i0.\u0275\u0275text(1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = i0.\u0275\u0275nextContext();
    i0.\u0275\u0275advance();
    i0.\u0275\u0275textInterpolate(ctx_r0.error);
  }
}
var LoginComponent = class _LoginComponent {
  fb = inject3(FormBuilder);
  authService = inject3(AuthService);
  router = inject3(Router3);
  loading = false;
  error = "";
  form = this.fb.nonNullable.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required, Validators.minLength(8)]]
  });
  onSubmit() {
    if (this.form.invalid)
      return;
    this.loading = true;
    this.error = "";
    this.authService.login(this.form.getRawValue()).subscribe({
      next: (res) => {
        if (res.success && res.data && this.authService.isAuthenticated()) {
          this.router.navigate(["/dashboard"]);
        } else {
          this.error = res.message || "Login failed. Please try again.";
        }
        this.loading = false;
      },
      error: () => {
        this.error = "Invalid credentials";
        this.loading = false;
      }
    });
  }
  static \u0275fac = function LoginComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _LoginComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({ type: _LoginComponent, selectors: [["app-login"]], decls: 13, vars: 4, consts: [[1, "login-page"], [3, "ngSubmit", "formGroup"], [1, "error"], ["type", "email", "formControlName", "email"], ["type", "password", "formControlName", "password"], ["type", "submit", 3, "disabled"]], template: function LoginComponent_Template(rf, ctx) {
    if (rf & 1) {
      i0.\u0275\u0275elementStart(0, "div", 0)(1, "form", 1);
      i0.\u0275\u0275listener("ngSubmit", function LoginComponent_Template_form_ngSubmit_1_listener() {
        return ctx.onSubmit();
      });
      i0.\u0275\u0275elementStart(2, "h2");
      i0.\u0275\u0275text(3, "Kabootar Admin");
      i0.\u0275\u0275elementEnd();
      i0.\u0275\u0275template(4, LoginComponent_Conditional_4_Template, 2, 1, "p", 2);
      i0.\u0275\u0275elementStart(5, "label");
      i0.\u0275\u0275text(6, " Email ");
      i0.\u0275\u0275element(7, "input", 3);
      i0.\u0275\u0275elementEnd();
      i0.\u0275\u0275elementStart(8, "label");
      i0.\u0275\u0275text(9, " Password ");
      i0.\u0275\u0275element(10, "input", 4);
      i0.\u0275\u0275elementEnd();
      i0.\u0275\u0275elementStart(11, "button", 5);
      i0.\u0275\u0275text(12);
      i0.\u0275\u0275elementEnd()()();
    }
    if (rf & 2) {
      i0.\u0275\u0275advance();
      i0.\u0275\u0275property("formGroup", ctx.form);
      i0.\u0275\u0275advance(3);
      i0.\u0275\u0275conditional(ctx.error ? 4 : -1);
      i0.\u0275\u0275advance(7);
      i0.\u0275\u0275property("disabled", ctx.form.invalid || ctx.loading);
      i0.\u0275\u0275advance();
      i0.\u0275\u0275textInterpolate1(" ", ctx.loading ? "Signing in..." : "Sign In", " ");
    }
  }, dependencies: [ReactiveFormsModule, i1.\u0275NgNoValidate, i1.NgSelectOption, i1.\u0275NgSelectMultipleOption, i1.DefaultValueAccessor, i1.NumberValueAccessor, i1.RangeValueAccessor, i1.CheckboxControlValueAccessor, i1.SelectControlValueAccessor, i1.SelectMultipleControlValueAccessor, i1.RadioControlValueAccessor, i1.NgControlStatus, i1.NgControlStatusGroup, i1.RequiredValidator, i1.MinLengthValidator, i1.MaxLengthValidator, i1.PatternValidator, i1.CheckboxRequiredValidator, i1.EmailValidator, i1.MinValidator, i1.MaxValidator, i1.FormControlDirective, i1.FormGroupDirective, i1.FormControlName, i1.FormGroupName, i1.FormArrayName], styles: ["\n\n.login-page[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  min-height: 100vh;\n  background: #1a1a2e;\n}\nform[_ngcontent-%COMP%] {\n  background: #fff;\n  padding: 2rem;\n  border-radius: 8px;\n  width: 360px;\n  display: flex;\n  flex-direction: column;\n  gap: 1rem;\n}\nh2[_ngcontent-%COMP%] {\n  text-align: center;\n  margin-bottom: 0.5rem;\n}\nlabel[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 0.25rem;\n  font-size: 0.875rem;\n}\ninput[_ngcontent-%COMP%] {\n  padding: 0.5rem;\n  border: 1px solid #ddd;\n  border-radius: 4px;\n}\nbutton[_ngcontent-%COMP%] {\n  padding: 0.75rem;\n  background: #1a1a2e;\n  color: #fff;\n  border: none;\n  border-radius: 4px;\n  cursor: pointer;\n}\nbutton[_ngcontent-%COMP%]:disabled {\n  opacity: 0.6;\n}\n.error[_ngcontent-%COMP%] {\n  color: #e74c3c;\n  font-size: 0.875rem;\n}\n/*# sourceMappingURL=login.component.css.map */"] });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassMetadata(LoginComponent, [{
    type: Component,
    args: [{ selector: "app-login", standalone: true, imports: [ReactiveFormsModule], template: `
    <div class="login-page">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <h2>Kabootar Admin</h2>
        @if (error) {
          <p class="error">{{ error }}</p>
        }
        <label>
          Email
          <input type="email" formControlName="email" />
        </label>
        <label>
          Password
          <input type="password" formControlName="password" />
        </label>
        <button type="submit" [disabled]="form.invalid || loading">
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>
    </div>
  `, styles: ["/* angular:styles/component:css;1c01c6c8c84e4fa4a55b4c7c74090a837be8a7814f5c77e41ccc20f5be291c88;D:/Personal/My Work/Kabootar/apps/admin/src/app/features/auth/login.component.ts */\n.login-page {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  min-height: 100vh;\n  background: #1a1a2e;\n}\nform {\n  background: #fff;\n  padding: 2rem;\n  border-radius: 8px;\n  width: 360px;\n  display: flex;\n  flex-direction: column;\n  gap: 1rem;\n}\nh2 {\n  text-align: center;\n  margin-bottom: 0.5rem;\n}\nlabel {\n  display: flex;\n  flex-direction: column;\n  gap: 0.25rem;\n  font-size: 0.875rem;\n}\ninput {\n  padding: 0.5rem;\n  border: 1px solid #ddd;\n  border-radius: 4px;\n}\nbutton {\n  padding: 0.75rem;\n  background: #1a1a2e;\n  color: #fff;\n  border: none;\n  border-radius: 4px;\n  cursor: pointer;\n}\nbutton:disabled {\n  opacity: 0.6;\n}\n.error {\n  color: #e74c3c;\n  font-size: 0.875rem;\n}\n/*# sourceMappingURL=login.component.css.map */\n"] }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassDebugInfo(LoginComponent, { className: "LoginComponent", filePath: "src/app/features/auth/login.component.ts", lineNumber: 83 });
})();
(() => {
  const id = "src%2Fapp%2Ffeatures%2Fauth%2Flogin.component.ts%40LoginComponent";
  function LoginComponent_HmrLoad(t) {
    import(
      /* @vite-ignore */
      __vite__injectQuery(i0.\u0275\u0275getReplaceMetadataURL(id, t, import.meta.url), 'import')
    ).then((m) => m.default && i0.\u0275\u0275replaceMetadata(LoginComponent, m.default, [i0, i1], [ReactiveFormsModule, Component], import.meta, id));
  }
  (typeof ngDevMode === "undefined" || ngDevMode) && LoginComponent_HmrLoad(Date.now());
  (typeof ngDevMode === "undefined" || ngDevMode) && (import.meta.hot && import.meta.hot.on("angular:component-update", (d) => d.id === id && LoginComponent_HmrLoad(d.timestamp)));
})();

// src/app/features/auth/auth.routes.ts
var AUTH_ROUTES = [
  { path: "", redirectTo: "login", pathMatch: "full" },
  { path: "login", component: LoginComponent, canActivate: [guestGuard] }
];

// src/app/app.routes.ts
var routes = [
  {
    path: "auth",
    children: AUTH_ROUTES
  },
  {
    path: "",
    canActivate: [authGuard],
    children: [
      {
        path: "",
        loadComponent: () => import("/chunk-CVXUQUTP.js").then((m) => m.AdminLayoutComponent),
        children: [
          {
            path: "",
            redirectTo: "dashboard",
            pathMatch: "full"
          },
          {
            path: "dashboard",
            loadComponent: () => import("/chunk-YAMNSOOT.js").then((m) => m.DashboardComponent),
            data: {
              title: "Dashboard",
              subtitle: "Overview of your tournament platform"
            }
          },
          {
            path: "tournaments",
            loadChildren: () => import("/chunk-TQ3DAGC4.js").then((m) => m.TOURNAMENT_ROUTES),
            data: {
              title: "Tournaments",
              subtitle: "Manage racing events and schedules"
            }
          },
          {
            path: "pigeons",
            loadChildren: () => import("/chunk-PHW22GFS.js").then((m) => m.PIGEON_ROUTES),
            data: {
              title: "Pigeons",
              subtitle: "Track registered birds"
            }
          },
          {
            path: "users",
            loadChildren: () => import("/chunk-A4FUH2P4.js").then((m) => m.USER_ROUTES),
            data: {
              title: "Users",
              subtitle: "Manage participants and roles"
            }
          }
        ]
      }
    ]
  },
  { path: "**", redirectTo: "auth/login" }
];

// src/app/core/interceptors/auth.interceptor.ts
import { inject as inject4 } from "/@fs/D:/Personal/My Work/Kabootar/apps/admin/.angular/cache/19.2.27/admin/vite/deps/@angular_core.js?v=a6adf28c";
var authInterceptor = (req, next) => {
  const authService = inject4(AuthService);
  const token = authService.getAccessToken();
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};

// src/app/core/interceptors/error.interceptor.ts
import { inject as inject5 } from "/@fs/D:/Personal/My Work/Kabootar/apps/admin/.angular/cache/19.2.27/admin/vite/deps/@angular_core.js?v=a6adf28c";
import { catchError, throwError } from "/@fs/D:/Personal/My Work/Kabootar/apps/admin/.angular/cache/19.2.27/admin/vite/deps/rxjs.js?v=a6adf28c";
function isAuthRequest(url) {
  return /\/auth\/(login|register|refresh)(?:\?|$)/.test(url);
}
var errorInterceptor = (req, next) => {
  const authService = inject5(AuthService);
  return next(req).pipe(catchError((error) => {
    if (error.status === 401 && !isAuthRequest(req.url)) {
      authService.logout();
    }
    return throwError(() => error);
  }));
};

// src/app/app.config.ts
var appConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withEnabledBlockingInitialNavigation()),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]))
  ]
};

// src/app/app.component.ts
import { Component as Component2 } from "/@fs/D:/Personal/My Work/Kabootar/apps/admin/.angular/cache/19.2.27/admin/vite/deps/@angular_core.js?v=a6adf28c";
import { RouterOutlet } from "/@fs/D:/Personal/My Work/Kabootar/apps/admin/.angular/cache/19.2.27/admin/vite/deps/@angular_router.js?v=a6adf28c";
import * as i02 from "/@fs/D:/Personal/My Work/Kabootar/apps/admin/.angular/cache/19.2.27/admin/vite/deps/@angular_core.js?v=a6adf28c";
var AppComponent = class _AppComponent {
  static \u0275fac = function AppComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _AppComponent)();
  };
  static \u0275cmp = /* @__PURE__ */ i02.\u0275\u0275defineComponent({ type: _AppComponent, selectors: [["app-root"]], decls: 1, vars: 0, template: function AppComponent_Template(rf, ctx) {
    if (rf & 1) {
      i02.\u0275\u0275element(0, "router-outlet");
    }
  }, dependencies: [RouterOutlet], encapsulation: 2 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i02.\u0275setClassMetadata(AppComponent, [{
    type: Component2,
    args: [{
      selector: "app-root",
      standalone: true,
      imports: [RouterOutlet],
      template: `<router-outlet />`
    }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i02.\u0275setClassDebugInfo(AppComponent, { className: "AppComponent", filePath: "src/app/app.component.ts", lineNumber: 10 });
})();
(() => {
  const id = "src%2Fapp%2Fapp.component.ts%40AppComponent";
  function AppComponent_HmrLoad(t) {
    import(
      /* @vite-ignore */
      __vite__injectQuery(i02.\u0275\u0275getReplaceMetadataURL(id, t, import.meta.url), 'import')
    ).then((m) => m.default && i02.\u0275\u0275replaceMetadata(AppComponent, m.default, [i02], [RouterOutlet, Component2], import.meta, id));
  }
  (typeof ngDevMode === "undefined" || ngDevMode) && AppComponent_HmrLoad(Date.now());
  (typeof ngDevMode === "undefined" || ngDevMode) && (import.meta.hot && import.meta.hot.on("angular:component-update", (d) => d.id === id && AppComponent_HmrLoad(d.timestamp)));
})();

// src/main.ts
bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9tYWluLnRzIiwic3JjL2FwcC9hcHAuY29uZmlnLnRzIiwic3JjL2FwcC9jb3JlL2d1YXJkcy9hdXRoLmd1YXJkLnRzIiwic3JjL2FwcC9jb3JlL2d1YXJkcy9ndWVzdC5ndWFyZC50cyIsInNyYy9hcHAvZmVhdHVyZXMvYXV0aC9sb2dpbi5jb21wb25lbnQudHMiLCJzcmMvYXBwL2ZlYXR1cmVzL2F1dGgvYXV0aC5yb3V0ZXMudHMiLCJzcmMvYXBwL2FwcC5yb3V0ZXMudHMiLCJzcmMvYXBwL2NvcmUvaW50ZXJjZXB0b3JzL2F1dGguaW50ZXJjZXB0b3IudHMiLCJzcmMvYXBwL2NvcmUvaW50ZXJjZXB0b3JzL2Vycm9yLmludGVyY2VwdG9yLnRzIiwic3JjL2FwcC9hcHAuY29tcG9uZW50LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGJvb3RzdHJhcEFwcGxpY2F0aW9uIH0gZnJvbSAnQGFuZ3VsYXIvcGxhdGZvcm0tYnJvd3Nlcic7XHJcbmltcG9ydCB7IGFwcENvbmZpZyB9IGZyb20gJy4vYXBwL2FwcC5jb25maWcnO1xyXG5pbXBvcnQgeyBBcHBDb21wb25lbnQgfSBmcm9tICcuL2FwcC9hcHAuY29tcG9uZW50JztcclxuXHJcbmJvb3RzdHJhcEFwcGxpY2F0aW9uKEFwcENvbXBvbmVudCwgYXBwQ29uZmlnKS5jYXRjaCgoZXJyKSA9PiBjb25zb2xlLmVycm9yKGVycikpO1xyXG4iLCJpbXBvcnQgeyBBcHBsaWNhdGlvbkNvbmZpZywgcHJvdmlkZVpvbmVDaGFuZ2VEZXRlY3Rpb24gfSBmcm9tICdAYW5ndWxhci9jb3JlJztcclxuaW1wb3J0IHsgcHJvdmlkZVJvdXRlciwgd2l0aEVuYWJsZWRCbG9ja2luZ0luaXRpYWxOYXZpZ2F0aW9uIH0gZnJvbSAnQGFuZ3VsYXIvcm91dGVyJztcclxuaW1wb3J0IHsgcHJvdmlkZUh0dHBDbGllbnQsIHdpdGhJbnRlcmNlcHRvcnMgfSBmcm9tICdAYW5ndWxhci9jb21tb24vaHR0cCc7XHJcblxyXG5pbXBvcnQgeyByb3V0ZXMgfSBmcm9tICcuL2FwcC5yb3V0ZXMnO1xyXG5pbXBvcnQgeyBhdXRoSW50ZXJjZXB0b3IgfSBmcm9tICcuL2NvcmUvaW50ZXJjZXB0b3JzL2F1dGguaW50ZXJjZXB0b3InO1xyXG5pbXBvcnQgeyBlcnJvckludGVyY2VwdG9yIH0gZnJvbSAnLi9jb3JlL2ludGVyY2VwdG9ycy9lcnJvci5pbnRlcmNlcHRvcic7XHJcblxyXG5leHBvcnQgY29uc3QgYXBwQ29uZmlnOiBBcHBsaWNhdGlvbkNvbmZpZyA9IHtcclxuICBwcm92aWRlcnM6IFtcclxuICAgIHByb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uKHsgZXZlbnRDb2FsZXNjaW5nOiB0cnVlIH0pLFxyXG4gICAgcHJvdmlkZVJvdXRlcihyb3V0ZXMsIHdpdGhFbmFibGVkQmxvY2tpbmdJbml0aWFsTmF2aWdhdGlvbigpKSxcclxuICAgIHByb3ZpZGVIdHRwQ2xpZW50KHdpdGhJbnRlcmNlcHRvcnMoW2F1dGhJbnRlcmNlcHRvciwgZXJyb3JJbnRlcmNlcHRvcl0pKSxcclxuICBdLFxyXG59O1xyXG4iLCJpbXBvcnQgeyBpbmplY3QgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcclxuaW1wb3J0IHsgQ2FuQWN0aXZhdGVGbiwgUm91dGVyIH0gZnJvbSAnQGFuZ3VsYXIvcm91dGVyJztcclxuXHJcbmltcG9ydCB7IEF1dGhTZXJ2aWNlIH0gZnJvbSAnLi4vc2VydmljZXMvYXV0aC5zZXJ2aWNlJztcclxuXHJcbmV4cG9ydCBjb25zdCBhdXRoR3VhcmQ6IENhbkFjdGl2YXRlRm4gPSAoKSA9PiB7XHJcbiAgY29uc3QgYXV0aFNlcnZpY2UgPSBpbmplY3QoQXV0aFNlcnZpY2UpO1xyXG4gIGNvbnN0IHJvdXRlciA9IGluamVjdChSb3V0ZXIpO1xyXG5cclxuICBpZiAoYXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkpIHtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHJvdXRlci5jcmVhdGVVcmxUcmVlKFsnL2F1dGgvbG9naW4nXSk7XHJcbn07XHJcbiIsImltcG9ydCB7IGluamVjdCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5pbXBvcnQgeyBDYW5BY3RpdmF0ZUZuLCBSb3V0ZXIgfSBmcm9tICdAYW5ndWxhci9yb3V0ZXInO1xyXG5cclxuaW1wb3J0IHsgQXV0aFNlcnZpY2UgfSBmcm9tICcuLi9zZXJ2aWNlcy9hdXRoLnNlcnZpY2UnO1xyXG5cclxuZXhwb3J0IGNvbnN0IGd1ZXN0R3VhcmQ6IENhbkFjdGl2YXRlRm4gPSAoKSA9PiB7XHJcbiAgY29uc3QgYXV0aFNlcnZpY2UgPSBpbmplY3QoQXV0aFNlcnZpY2UpO1xyXG4gIGNvbnN0IHJvdXRlciA9IGluamVjdChSb3V0ZXIpO1xyXG5cclxuICBpZiAoIWF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpKSB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcblxyXG4gIHJldHVybiByb3V0ZXIuY3JlYXRlVXJsVHJlZShbJy9kYXNoYm9hcmQnXSk7XHJcbn07XHJcbiIsImltcG9ydCB7IENvbXBvbmVudCwgaW5qZWN0IH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCB7IEZvcm1CdWlsZGVyLCBSZWFjdGl2ZUZvcm1zTW9kdWxlLCBWYWxpZGF0b3JzIH0gZnJvbSAnQGFuZ3VsYXIvZm9ybXMnO1xyXG5pbXBvcnQgeyBSb3V0ZXIgfSBmcm9tICdAYW5ndWxhci9yb3V0ZXInO1xyXG5cclxuaW1wb3J0IHsgQXV0aFNlcnZpY2UgfSBmcm9tICcuLi8uLi9jb3JlL3NlcnZpY2VzL2F1dGguc2VydmljZSc7XHJcblxyXG5AQ29tcG9uZW50KHtcclxuICBzZWxlY3RvcjogJ2FwcC1sb2dpbicsXHJcbiAgc3RhbmRhbG9uZTogdHJ1ZSxcclxuICBpbXBvcnRzOiBbUmVhY3RpdmVGb3Jtc01vZHVsZV0sXHJcbiAgdGVtcGxhdGU6IGBcclxuICAgIDxkaXYgY2xhc3M9XCJsb2dpbi1wYWdlXCI+XHJcbiAgICAgIDxmb3JtIFtmb3JtR3JvdXBdPVwiZm9ybVwiIChuZ1N1Ym1pdCk9XCJvblN1Ym1pdCgpXCI+XHJcbiAgICAgICAgPGgyPkthYm9vdGFyIEFkbWluPC9oMj5cclxuICAgICAgICBAaWYgKGVycm9yKSB7XHJcbiAgICAgICAgICA8cCBjbGFzcz1cImVycm9yXCI+e3sgZXJyb3IgfX08L3A+XHJcbiAgICAgICAgfVxyXG4gICAgICAgIDxsYWJlbD5cclxuICAgICAgICAgIEVtYWlsXHJcbiAgICAgICAgICA8aW5wdXQgdHlwZT1cImVtYWlsXCIgZm9ybUNvbnRyb2xOYW1lPVwiZW1haWxcIiAvPlxyXG4gICAgICAgIDwvbGFiZWw+XHJcbiAgICAgICAgPGxhYmVsPlxyXG4gICAgICAgICAgUGFzc3dvcmRcclxuICAgICAgICAgIDxpbnB1dCB0eXBlPVwicGFzc3dvcmRcIiBmb3JtQ29udHJvbE5hbWU9XCJwYXNzd29yZFwiIC8+XHJcbiAgICAgICAgPC9sYWJlbD5cclxuICAgICAgICA8YnV0dG9uIHR5cGU9XCJzdWJtaXRcIiBbZGlzYWJsZWRdPVwiZm9ybS5pbnZhbGlkIHx8IGxvYWRpbmdcIj5cclxuICAgICAgICAgIHt7IGxvYWRpbmcgPyAnU2lnbmluZyBpbi4uLicgOiAnU2lnbiBJbicgfX1cclxuICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgPC9mb3JtPlxyXG4gICAgPC9kaXY+XHJcbiAgYCxcclxuICBzdHlsZXM6IFtcclxuICAgIGBcclxuICAgICAgLmxvZ2luLXBhZ2Uge1xyXG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XHJcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcclxuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcclxuICAgICAgICBtaW4taGVpZ2h0OiAxMDB2aDtcclxuICAgICAgICBiYWNrZ3JvdW5kOiAjMWExYTJlO1xyXG4gICAgICB9XHJcbiAgICAgIGZvcm0ge1xyXG4gICAgICAgIGJhY2tncm91bmQ6ICNmZmY7XHJcbiAgICAgICAgcGFkZGluZzogMnJlbTtcclxuICAgICAgICBib3JkZXItcmFkaXVzOiA4cHg7XHJcbiAgICAgICAgd2lkdGg6IDM2MHB4O1xyXG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XHJcbiAgICAgICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcclxuICAgICAgICBnYXA6IDFyZW07XHJcbiAgICAgIH1cclxuICAgICAgaDIge1xyXG4gICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcclxuICAgICAgICBtYXJnaW4tYm90dG9tOiAwLjVyZW07XHJcbiAgICAgIH1cclxuICAgICAgbGFiZWwge1xyXG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XHJcbiAgICAgICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcclxuICAgICAgICBnYXA6IDAuMjVyZW07XHJcbiAgICAgICAgZm9udC1zaXplOiAwLjg3NXJlbTtcclxuICAgICAgfVxyXG4gICAgICBpbnB1dCB7XHJcbiAgICAgICAgcGFkZGluZzogMC41cmVtO1xyXG4gICAgICAgIGJvcmRlcjogMXB4IHNvbGlkICNkZGQ7XHJcbiAgICAgICAgYm9yZGVyLXJhZGl1czogNHB4O1xyXG4gICAgICB9XHJcbiAgICAgIGJ1dHRvbiB7XHJcbiAgICAgICAgcGFkZGluZzogMC43NXJlbTtcclxuICAgICAgICBiYWNrZ3JvdW5kOiAjMWExYTJlO1xyXG4gICAgICAgIGNvbG9yOiAjZmZmO1xyXG4gICAgICAgIGJvcmRlcjogbm9uZTtcclxuICAgICAgICBib3JkZXItcmFkaXVzOiA0cHg7XHJcbiAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xyXG4gICAgICB9XHJcbiAgICAgIGJ1dHRvbjpkaXNhYmxlZCB7XHJcbiAgICAgICAgb3BhY2l0eTogMC42O1xyXG4gICAgICB9XHJcbiAgICAgIC5lcnJvciB7XHJcbiAgICAgICAgY29sb3I6ICNlNzRjM2M7XHJcbiAgICAgICAgZm9udC1zaXplOiAwLjg3NXJlbTtcclxuICAgICAgfVxyXG4gICAgYCxcclxuICBdLFxyXG59KVxyXG5leHBvcnQgY2xhc3MgTG9naW5Db21wb25lbnQge1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgZmIgPSBpbmplY3QoRm9ybUJ1aWxkZXIpO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgYXV0aFNlcnZpY2UgPSBpbmplY3QoQXV0aFNlcnZpY2UpO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgcm91dGVyID0gaW5qZWN0KFJvdXRlcik7XHJcblxyXG4gIGxvYWRpbmcgPSBmYWxzZTtcclxuICBlcnJvciA9ICcnO1xyXG5cclxuICBmb3JtID0gdGhpcy5mYi5ub25OdWxsYWJsZS5ncm91cCh7XHJcbiAgICBlbWFpbDogWycnLCBbVmFsaWRhdG9ycy5yZXF1aXJlZCwgVmFsaWRhdG9ycy5lbWFpbF1dLFxyXG4gICAgcGFzc3dvcmQ6IFsnJywgW1ZhbGlkYXRvcnMucmVxdWlyZWQsIFZhbGlkYXRvcnMubWluTGVuZ3RoKDgpXV0sXHJcbiAgfSk7XHJcblxyXG4gIG9uU3VibWl0KCk6IHZvaWQge1xyXG4gICAgaWYgKHRoaXMuZm9ybS5pbnZhbGlkKSByZXR1cm47XHJcbiAgICB0aGlzLmxvYWRpbmcgPSB0cnVlO1xyXG4gICAgdGhpcy5lcnJvciA9ICcnO1xyXG5cclxuICAgIHRoaXMuYXV0aFNlcnZpY2UubG9naW4odGhpcy5mb3JtLmdldFJhd1ZhbHVlKCkpLnN1YnNjcmliZSh7XHJcbiAgICAgIG5leHQ6IChyZXMpID0+IHtcclxuICAgICAgICBpZiAocmVzLnN1Y2Nlc3MgJiYgcmVzLmRhdGEgJiYgdGhpcy5hdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSkge1xyXG4gICAgICAgICAgdGhpcy5yb3V0ZXIubmF2aWdhdGUoWycvZGFzaGJvYXJkJ10pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB0aGlzLmVycm9yID0gcmVzLm1lc3NhZ2UgfHwgJ0xvZ2luIGZhaWxlZC4gUGxlYXNlIHRyeSBhZ2Fpbi4nO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmxvYWRpbmcgPSBmYWxzZTtcclxuICAgICAgfSxcclxuICAgICAgZXJyb3I6ICgpID0+IHtcclxuICAgICAgICB0aGlzLmVycm9yID0gJ0ludmFsaWQgY3JlZGVudGlhbHMnO1xyXG4gICAgICAgIHRoaXMubG9hZGluZyA9IGZhbHNlO1xyXG4gICAgICB9LFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcbiIsImltcG9ydCB7IFJvdXRlcyB9IGZyb20gJ0Bhbmd1bGFyL3JvdXRlcic7XHJcblxyXG5pbXBvcnQgeyBndWVzdEd1YXJkIH0gZnJvbSAnLi4vLi4vY29yZS9ndWFyZHMvZ3Vlc3QuZ3VhcmQnO1xyXG5pbXBvcnQgeyBMb2dpbkNvbXBvbmVudCB9IGZyb20gJy4vbG9naW4uY29tcG9uZW50JztcclxuXHJcbmV4cG9ydCBjb25zdCBBVVRIX1JPVVRFUzogUm91dGVzID0gW1xyXG4gIHsgcGF0aDogJycsIHJlZGlyZWN0VG86ICdsb2dpbicsIHBhdGhNYXRjaDogJ2Z1bGwnIH0sXHJcbiAgeyBwYXRoOiAnbG9naW4nLCBjb21wb25lbnQ6IExvZ2luQ29tcG9uZW50LCBjYW5BY3RpdmF0ZTogW2d1ZXN0R3VhcmRdIH0sXHJcbl07XHJcbiIsImltcG9ydCB7IFJvdXRlcyB9IGZyb20gJ0Bhbmd1bGFyL3JvdXRlcic7XHJcbmltcG9ydCB7IGF1dGhHdWFyZCB9IGZyb20gJy4vY29yZS9ndWFyZHMvYXV0aC5ndWFyZCc7XHJcbmltcG9ydCB7IEFVVEhfUk9VVEVTIH0gZnJvbSAnLi9mZWF0dXJlcy9hdXRoL2F1dGgucm91dGVzJztcclxuXHJcbmV4cG9ydCBjb25zdCByb3V0ZXM6IFJvdXRlcyA9IFtcclxuICB7XHJcbiAgICBwYXRoOiAnYXV0aCcsXHJcbiAgICBjaGlsZHJlbjogQVVUSF9ST1VURVMsXHJcbiAgfSxcclxuICB7XHJcbiAgICBwYXRoOiAnJyxcclxuICAgIGNhbkFjdGl2YXRlOiBbYXV0aEd1YXJkXSxcclxuICAgIGNoaWxkcmVuOiBbXHJcbiAgICAgIHtcclxuICAgICAgICBwYXRoOiAnJyxcclxuICAgICAgICBsb2FkQ29tcG9uZW50OiAoKSA9PlxyXG4gICAgICAgICAgaW1wb3J0KCcuL2xheW91dC9hZG1pbi1sYXlvdXQvYWRtaW4tbGF5b3V0LmNvbXBvbmVudCcpLnRoZW4oXHJcbiAgICAgICAgICAgIChtKSA9PiBtLkFkbWluTGF5b3V0Q29tcG9uZW50LFxyXG4gICAgICAgICAgKSxcclxuICAgICAgICBjaGlsZHJlbjogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBwYXRoOiAnJyxcclxuICAgICAgICAgICAgcmVkaXJlY3RUbzogJ2Rhc2hib2FyZCcsXHJcbiAgICAgICAgICAgIHBhdGhNYXRjaDogJ2Z1bGwnLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgcGF0aDogJ2Rhc2hib2FyZCcsXHJcbiAgICAgICAgICAgIGxvYWRDb21wb25lbnQ6ICgpID0+XHJcbiAgICAgICAgICAgICAgaW1wb3J0KCcuL2ZlYXR1cmVzL2Rhc2hib2FyZC9kYXNoYm9hcmQuY29tcG9uZW50JykudGhlbihcclxuICAgICAgICAgICAgICAgIChtKSA9PiBtLkRhc2hib2FyZENvbXBvbmVudCxcclxuICAgICAgICAgICAgICApLFxyXG4gICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgdGl0bGU6ICdEYXNoYm9hcmQnLFxyXG4gICAgICAgICAgICAgIHN1YnRpdGxlOiAnT3ZlcnZpZXcgb2YgeW91ciB0b3VybmFtZW50IHBsYXRmb3JtJyxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHBhdGg6ICd0b3VybmFtZW50cycsXHJcbiAgICAgICAgICAgIGxvYWRDaGlsZHJlbjogKCkgPT5cclxuICAgICAgICAgICAgICBpbXBvcnQoJy4vZmVhdHVyZXMvdG91cm5hbWVudHMvdG91cm5hbWVudHMucm91dGVzJykudGhlbihcclxuICAgICAgICAgICAgICAgIChtKSA9PiBtLlRPVVJOQU1FTlRfUk9VVEVTLFxyXG4gICAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICB0aXRsZTogJ1RvdXJuYW1lbnRzJyxcclxuICAgICAgICAgICAgICBzdWJ0aXRsZTogJ01hbmFnZSByYWNpbmcgZXZlbnRzIGFuZCBzY2hlZHVsZXMnLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgcGF0aDogJ3BpZ2VvbnMnLFxyXG4gICAgICAgICAgICBsb2FkQ2hpbGRyZW46ICgpID0+XHJcbiAgICAgICAgICAgICAgaW1wb3J0KCcuL2ZlYXR1cmVzL3BpZ2VvbnMvcGlnZW9ucy5yb3V0ZXMnKS50aGVuKChtKSA9PiBtLlBJR0VPTl9ST1VURVMpLFxyXG4gICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgdGl0bGU6ICdQaWdlb25zJyxcclxuICAgICAgICAgICAgICBzdWJ0aXRsZTogJ1RyYWNrIHJlZ2lzdGVyZWQgYmlyZHMnLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgcGF0aDogJ3VzZXJzJyxcclxuICAgICAgICAgICAgbG9hZENoaWxkcmVuOiAoKSA9PlxyXG4gICAgICAgICAgICAgIGltcG9ydCgnLi9mZWF0dXJlcy91c2Vycy91c2Vycy5yb3V0ZXMnKS50aGVuKChtKSA9PiBtLlVTRVJfUk9VVEVTKSxcclxuICAgICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICAgIHRpdGxlOiAnVXNlcnMnLFxyXG4gICAgICAgICAgICAgIHN1YnRpdGxlOiAnTWFuYWdlIHBhcnRpY2lwYW50cyBhbmQgcm9sZXMnLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICBdLFxyXG4gICAgICB9LFxyXG4gICAgXSxcclxuICB9LFxyXG4gIHsgcGF0aDogJyoqJywgcmVkaXJlY3RUbzogJ2F1dGgvbG9naW4nIH0sXHJcbl07XHJcbiIsImltcG9ydCB7IEh0dHBJbnRlcmNlcHRvckZuIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uL2h0dHAnO1xyXG5pbXBvcnQgeyBpbmplY3QgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcclxuXHJcbmltcG9ydCB7IEF1dGhTZXJ2aWNlIH0gZnJvbSAnLi4vc2VydmljZXMvYXV0aC5zZXJ2aWNlJztcclxuXHJcbmV4cG9ydCBjb25zdCBhdXRoSW50ZXJjZXB0b3I6IEh0dHBJbnRlcmNlcHRvckZuID0gKHJlcSwgbmV4dCkgPT4ge1xyXG4gIGNvbnN0IGF1dGhTZXJ2aWNlID0gaW5qZWN0KEF1dGhTZXJ2aWNlKTtcclxuICBjb25zdCB0b2tlbiA9IGF1dGhTZXJ2aWNlLmdldEFjY2Vzc1Rva2VuKCk7XHJcblxyXG4gIGlmICh0b2tlbikge1xyXG4gICAgcmVxID0gcmVxLmNsb25lKHsgc2V0SGVhZGVyczogeyBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7dG9rZW59YCB9IH0pO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIG5leHQocmVxKTtcclxufTtcclxuIiwiaW1wb3J0IHsgSHR0cEludGVyY2VwdG9yRm4sIEh0dHBFcnJvclJlc3BvbnNlIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uL2h0dHAnO1xyXG5pbXBvcnQgeyBpbmplY3QgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcclxuaW1wb3J0IHsgY2F0Y2hFcnJvciwgdGhyb3dFcnJvciB9IGZyb20gJ3J4anMnO1xyXG5cclxuaW1wb3J0IHsgQXV0aFNlcnZpY2UgfSBmcm9tICcuLi9zZXJ2aWNlcy9hdXRoLnNlcnZpY2UnO1xyXG5cclxuZnVuY3Rpb24gaXNBdXRoUmVxdWVzdCh1cmw6IHN0cmluZyk6IGJvb2xlYW4ge1xyXG4gIHJldHVybiAvXFwvYXV0aFxcLyhsb2dpbnxyZWdpc3RlcnxyZWZyZXNoKSg/OlxcP3wkKS8udGVzdCh1cmwpO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgZXJyb3JJbnRlcmNlcHRvcjogSHR0cEludGVyY2VwdG9yRm4gPSAocmVxLCBuZXh0KSA9PiB7XHJcbiAgY29uc3QgYXV0aFNlcnZpY2UgPSBpbmplY3QoQXV0aFNlcnZpY2UpO1xyXG5cclxuICByZXR1cm4gbmV4dChyZXEpLnBpcGUoXHJcbiAgICBjYXRjaEVycm9yKChlcnJvcjogSHR0cEVycm9yUmVzcG9uc2UpID0+IHtcclxuICAgICAgaWYgKGVycm9yLnN0YXR1cyA9PT0gNDAxICYmICFpc0F1dGhSZXF1ZXN0KHJlcS51cmwpKSB7XHJcbiAgICAgICAgYXV0aFNlcnZpY2UubG9nb3V0KCk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHRocm93RXJyb3IoKCkgPT4gZXJyb3IpO1xyXG4gICAgfSksXHJcbiAgKTtcclxufTtcclxuIiwiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCB7IFJvdXRlck91dGxldCB9IGZyb20gJ0Bhbmd1bGFyL3JvdXRlcic7XHJcblxyXG5AQ29tcG9uZW50KHtcclxuICBzZWxlY3RvcjogJ2FwcC1yb290JyxcclxuICBzdGFuZGFsb25lOiB0cnVlLFxyXG4gIGltcG9ydHM6IFtSb3V0ZXJPdXRsZXRdLFxyXG4gIHRlbXBsYXRlOiBgPHJvdXRlci1vdXRsZXQgLz5gLFxyXG59KVxyXG5leHBvcnQgY2xhc3MgQXBwQ29tcG9uZW50IHt9XHJcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBLFNBQVMsNEJBQTRCOzs7QUNBckMsU0FBNEIsa0NBQWtDO0FBQzlELFNBQVMsZUFBZSw0Q0FBNEM7QUFDcEUsU0FBUyxtQkFBbUIsd0JBQXdCOzs7QUNGcEQsU0FBUyxjQUFjO0FBQ3ZCLFNBQXdCLGNBQWM7QUFJL0IsSUFBTSxZQUEyQixNQUFLO0FBQzNDLFFBQU0sY0FBYyxPQUFPLFdBQVc7QUFDdEMsUUFBTSxTQUFTLE9BQU8sTUFBTTtBQUU1QixNQUFJLFlBQVksZ0JBQWUsR0FBSTtBQUNqQyxXQUFPO0VBQ1Q7QUFFQSxTQUFPLE9BQU8sY0FBYyxDQUFDLGFBQWEsQ0FBQztBQUM3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VixZQUFZO01BQ1osU0FBUyxDQUFDLFlBQVk7TUFDdEIsVUFBVTtLQUNYOzs7O2lGQUNZLGNBQVksRUFBQSxXQUFBLGdCQUFBLFVBQUEsNEJBQUEsWUFBQSxHQUFBLENBQUE7QUFBQSxHQUFBOzs7Ozs7OytEQUFaLGNBQVksRUFBQSxTQUFBLENBQUFDLEdBQUEsR0FBQSxDQUFBLGNBQUFELFVBQUEsR0FBQSxhQUFBLEVBQUEsQ0FBQTtFQUFBO0FBQUEsR0FBQSxPQUFBLGNBQUEsZUFBQSxjQUFBLHFCQUFBLEtBQUEsSUFBQSxDQUFBO0FBQUEsR0FBQSxPQUFBLGNBQUEsZUFBQSxlQUFBLFlBQUEsT0FBQSxZQUFBLElBQUEsR0FBQSw0QkFBQSxPQUFBLEVBQUEsT0FBQSxNQUFBLHFCQUFBLEVBQUEsU0FBQSxDQUFBO0FBQUEsR0FBQTs7O0FUTHpCLHFCQUFxQixjQUFjLFNBQVMsRUFBRSxNQUFNLENBQUMsUUFBUSxRQUFRLE1BQU0sR0FBRyxDQUFDOyIsIm5hbWVzIjpbImluamVjdCIsIlJvdXRlciIsImluamVjdCIsIlJvdXRlciIsImluamVjdCIsIlJvdXRlciIsImluamVjdCIsIlJvdXRlciIsImluamVjdCIsImluamVjdCIsImluamVjdCIsImluamVjdCIsIkNvbXBvbmVudCIsImkwIl19