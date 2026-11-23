import { Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-50 border-t">
      <div className="container max-w-6xl mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-6 w-6 text-prosafe-600" />
              <span className="text-xl font-bold text-prosafe-900">PROSAFE</span>
            </div>
            <p className="text-gray-600 mb-4">{t("footer.tagline")}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
              {t("footer.product")}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/features" className="text-gray-600 hover:text-prosafe-600">
                  {t("footer.features")}
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-gray-600 hover:text-prosafe-600">
                  {t("footer.pricing")}
                </Link>
              </li>
              <li>
                <Link to="/updates" className="text-gray-600 hover:text-prosafe-600">
                  {t("footer.updates")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
              {t("footer.company")}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-gray-600 hover:text-prosafe-600">
                  {t("navigation.about")}
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-gray-600 hover:text-prosafe-600">
                  {t("footer.careers")}
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-600 hover:text-prosafe-600">
                  {t("footer.blog")}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-600 hover:text-prosafe-600">
                  {t("navigation.contact")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
              {t("footer.legal")}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-gray-600 hover:text-prosafe-600">
                  {t("footer.privacy")}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-600 hover:text-prosafe-600">
                  {t("footer.terms")}
                </Link>
              </li>
              <li>
                <Link to="/security" className="text-gray-600 hover:text-prosafe-600">
                  {t("footer.security")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-200 pt-8">
          <p className="text-sm text-gray-400 text-center">
            &copy; {new Date().getFullYear()} PROSAFE. {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
