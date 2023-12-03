import { useRouteError } from "react-router-dom"
import styles from './styles/ErrorPage.module.scss'

export default function ErrorPage() {
    const error = useRouteError();
    console.error(error)
    return(
        <div className={styles.errorPageNest}>
            <h2>
                {error.statusText || error.message}
            </h2>
        </div>
    )
}