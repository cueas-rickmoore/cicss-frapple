
import datetime

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class AppleFrostToolCommonMethods:

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def appDateFormat(self, date):
        return date.strftime('%Y-%m-%d')

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def currentSeason(self):
        today = datetime.date.today()
        season = today.year
        # check to see if today is between season start and end of year
        start_day = self.tool.get('available_day', self.tool.season_start_day)
        season_start = datetime.date(season, *start_day)
        # today is after season start, season start is in first year of season
        if (today >= season_start): # so max available season is next year
            return season + 1
        # today is before next season starts, last available season has ended
        else: return season

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def dayToSeasonDate(self, season, day):
        if day[0] <= self.tool.season_end_day[0]:
            return datetime.date(season, *day)
        if day[0] >= self.tool.season_end_day[0]:
            return datetime.date(season-1, *day)
        return None

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def maxAvailableDate(self, year=None):
        if year is not None:
            max_date = self.seasonEndDate(year)
        else:
            max_date = self.seasonEndDate(self.maxAvailableSeason())
        return min(max_date, datetime.date.today())

    def minAvailableDate(self):
        return self.seasonStartDate(self.minAvailableSeason())

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def maxAvailableSeason(self):
        season = self.tool.get('last_season', None)
        if season is not None: return season
        # not specified in config, make a guess based on current date
        return self.currentSeason()

    def minAvailableSeason(self):
        season = self.tool.get('first_season', None)
        if season is not None: return season
        # not specified in config, make a guess based on current date
        return self.currentSeason()

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def seasonEndDate(self, target_year):
        return datetime.date(target_year, *self.tool.season_end_day)

    def seasonStartDate(self, target_year):
        start_day = self.tool.get('available_day', self.tool.season_start_day)
        if start_day[0] > self.tool.season_end_day[0]:
            return datetime.date(target_year-1, *start_day)
        return datetime.date(target_year, *start_day)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def targetYear(self, date):
        season_start = datetime.date(date.year, *self.tool.season_start_day)
        if date >= season_start: target_year = date.year+1
        else: target_year = date.year
        season_end = datetime.date(target_year, *self.project.end_day)
        if date <= season_end: return target_year
        else: return None


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class FrapplePropertyMethods(AppleFrostToolCommonMethods):

    def __init__(self, config, mode='prod'):
        self.tool = config.tool
        self.config = config
        self.mode_config = config.mode

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def toolProperties(self):
        year  = self.mode_config.get('season', None)
        if year is not None: year = datetime.date.today().year
        # add default date of interest
        default_doi = self.tool.default_doi
        if not isinstance(default_doi, basestring): # needs to be YYYY-MM_DD
            default_doi = \
                self.appDateFormat(self.dayToSeasonDate(year,default_doi))
        properties['default_doi'] = default_doi 
        properties['days_in_view'] = self.tool.days_in_view

        # add viriety deafults
        properties['default_variety'] = self.tool.default_variety
        varieties_js = [ ]
        for key in self.tool.varieties:
            description = server_config.tool.varieties[key].description
            varieties[key] = description
            varieties_js.append('%s:"%s"' % (key,description))
        properties['varieties_js'] = '{%s}' % ','.join(varieties_js)

        # check for multiple years ... always a sequence
        properties['min_year'] = self.tool.first_season
        if properties['min_year'] is None:
            the_year = self.maxAvailableSeason()
            properties['max_year'] = properties['min_year'] = the_year
        else:
            max_year = self.tool.get('last_season',None)
            if max_year is None: max_year = self.maxAvailableSeason()
            properties['max_year'] = max_year
        return properties

    
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def serverProperties(self):
        server_url = self.mode_config.server_url
        toolname = self.tool.toolname
        properties = { 'server_url':server_url, 'toolname':toolname }
        properties['tool_url'] = self.mode_config.get('tool_url',
                                 "%s/%s"  % (server_url,toolname))
        properties['csftool_url'] = \
            self.mode_config.get('csftool_url', "%s/csftool"  % server_url)
        return properties
