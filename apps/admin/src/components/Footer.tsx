import { Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      <div className="container max-w-6xl mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-6 w-6 text-prosafe-600 dark:text-prosafe-400" />
              <span className="text-xl font-bold text-prosafe-900 dark:text-white">PROSAFE</span>
            </div>
            <p className="text-gray-600 dark:text-slate-400 mb-4">{t("footer.tagline")}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 tracking-wider uppercase mb-4">
              {t("footer.product")}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/features" className="text-gray-600 dark:text-slate-400 hover:text-prosafe-600 dark:hover:text-prosafe-400">
                  {t("footer.features")}
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-gray-600 dark:text-slate-400 hover:text-prosafe-600 dark:hover:text-prosafe-400">
                  {t("footer.pricing")}
                </Link>
              </li>
              <li>
                <Link to="/updates" className="text-gray-600 dark:text-slate-400 hover:text-prosafe-600 dark:hover:text-prosafe-400">
                  {t("footer.updates")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 tracking-wider uppercase mb-4">
              {t("footer.company")}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-gray-600 dark:text-slate-400 hover:text-prosafe-600 dark:hover:text-prosafe-400">
                  {t("navigation.about")}
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-gray-600 dark:text-slate-400 hover:text-prosafe-600 dark:hover:text-prosafe-400">
                  {t("footer.careers")}
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-600 dark:text-slate-400 hover:text-prosafe-600 dark:hover:text-prosafe-400">
                  {t("footer.blog")}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-600 dark:text-slate-400 hover:text-prosafe-600 dark:hover:text-prosafe-400">
                  {t("navigation.contact")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 tracking-wider uppercase mb-4">
              {t("footer.legal")}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-gray-600 dark:text-slate-400 hover:text-prosafe-600 dark:hover:text-prosafe-400">
                  {t("footer.privacy")}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-600 dark:text-slate-400 hover:text-prosafe-600 dark:hover:text-prosafe-400">
                  {t("footer.terms")}
                </Link>
              </li>
              <li>
                <Link to="/security" className="text-gray-600 dark:text-slate-400 hover:text-prosafe-600 dark:hover:text-prosafe-400">
                  {t("footer.security")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-200 dark:border-slate-800 pt-8">
          <p className="text-sm text-gray-400 dark:text-slate-500 text-center">
            &copy; {new Date().getFullYear()} PROSAFE. {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
