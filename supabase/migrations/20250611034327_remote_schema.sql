-- CREATE TRIGGER trigger_update_last_login AFTER INSERT ON auth.sessions FOR EACH ROW EXECUTE FUNCTION update_last_login();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();


